
-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'student');
CREATE TYPE public.submission_status AS ENUM ('queued', 'processing', 'completed', 'flagged', 'review_pending', 'failed');
CREATE TYPE public.ai_likelihood AS ENUM ('low', 'moderate', 'high');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Institutions
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'starter',
  similarity_threshold INTEGER NOT NULL DEFAULT 25,
  ai_threshold INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Institution Themes
CREATE TABLE public.institution_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE UNIQUE,
  accent_color TEXT NOT NULL DEFAULT '#14b8a6',
  secondary_color TEXT,
  font_family TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.institution_themes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_institution_themes_updated_at BEFORE UPDATE ON public.institution_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User Roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'super_admin' THEN 1 WHEN 'school_admin' THEN 2 WHEN 'teacher' THEN 3 WHEN 'student' THEN 4 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_institution(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Departments
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Submissions
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  status submission_status NOT NULL DEFAULT 'queued',
  batch_id UUID,
  similarity_score NUMERIC(5,2),
  ai_score NUMERIC(5,2),
  paraphrase_score NUMERIC(5,2),
  ai_likelihood ai_likelihood,
  assigned_reviewer UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX idx_submissions_institution_id ON public.submissions(institution_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Matched Sources
CREATE TABLE public.matched_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  source_url TEXT,
  source_title TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'web',
  similarity_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  matched_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matched_sources ENABLE ROW LEVEL SECURITY;

-- Reviewer Comments
CREATE TABLE public.reviewer_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviewer_comments ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
CREATE POLICY "Anyone can view active institutions" ON public.institutions FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Super admins can manage institutions" ON public.institutions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view themes" ON public.institution_themes FOR SELECT TO authenticated USING (true);
CREATE POLICY "School admins can manage their theme" ON public.institution_themes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR (public.has_role(auth.uid(), 'school_admin') AND institution_id = public.get_user_institution(auth.uid())));

CREATE POLICY "Users can view profiles in their institution" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR institution_id = public.get_user_institution(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System creates profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "View departments in own institution" ON public.departments FOR SELECT TO authenticated USING (institution_id = public.get_user_institution(auth.uid()) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "School admins manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR (public.has_role(auth.uid(), 'school_admin') AND institution_id = public.get_user_institution(auth.uid())));

CREATE POLICY "Users can view own submissions" ON public.submissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR assigned_reviewer = auth.uid() OR (public.has_role(auth.uid(), 'teacher') AND institution_id = public.get_user_institution(auth.uid())) OR (public.has_role(auth.uid(), 'school_admin') AND institution_id = public.get_user_institution(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can create own submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Reviewers and admins can update submissions" ON public.submissions FOR UPDATE TO authenticated USING (user_id = auth.uid() OR assigned_reviewer = auth.uid() OR (public.has_role(auth.uid(), 'teacher') AND institution_id = public.get_user_institution(auth.uid())) OR (public.has_role(auth.uid(), 'school_admin') AND institution_id = public.get_user_institution(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "View matched sources" ON public.matched_sources FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (s.user_id = auth.uid() OR s.assigned_reviewer = auth.uid() OR (public.has_role(auth.uid(), 'teacher') AND s.institution_id = public.get_user_institution(auth.uid())) OR (public.has_role(auth.uid(), 'school_admin') AND s.institution_id = public.get_user_institution(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'))));

CREATE POLICY "View comments" ON public.reviewer_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND (s.user_id = auth.uid() OR s.assigned_reviewer = auth.uid() OR (public.has_role(auth.uid(), 'teacher') AND s.institution_id = public.get_user_institution(auth.uid())) OR public.has_role(auth.uid(), 'super_admin'))));
CREATE POLICY "Reviewers can add comments" ON public.reviewer_comments FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
