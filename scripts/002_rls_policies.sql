-- Profiles RLS Policies
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_public_data"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Courses RLS Policies
CREATE POLICY "courses_select_published"
  ON public.courses FOR SELECT
  USING (is_published = true);

CREATE POLICY "courses_select_own_draft"
  ON public.courses FOR SELECT
  USING (instructor_id = auth.uid());

CREATE POLICY "courses_insert_instructors"
  ON public.courses FOR INSERT
  WITH CHECK (
    instructor_id = auth.uid() AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('instructor', 'admin')
  );

CREATE POLICY "courses_update_own"
  ON public.courses FOR UPDATE
  USING (instructor_id = auth.uid());

CREATE POLICY "courses_delete_own"
  ON public.courses FOR DELETE
  USING (instructor_id = auth.uid());

-- Course Enrollments RLS Policies
CREATE POLICY "enrollments_select_own"
  ON public.course_enrollments FOR SELECT
  USING (student_id = auth.uid() OR (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid());

CREATE POLICY "enrollments_insert_students"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "enrollments_update_own"
  ON public.course_enrollments FOR UPDATE
  USING (student_id = auth.uid());

-- Assignments RLS Policies
CREATE POLICY "assignments_select_enrolled"
  ON public.assignments FOR SELECT
  USING (
    (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_id = assignments.course_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "assignments_insert_instructors"
  ON public.assignments FOR INSERT
  WITH CHECK (
    (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid()
  );

CREATE POLICY "assignments_update_instructors"
  ON public.assignments FOR UPDATE
  USING (
    (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid()
  );

-- Submissions RLS Policies
CREATE POLICY "submissions_select_own_or_instructor"
  ON public.submissions FOR SELECT
  USING (
    student_id = auth.uid() OR
    (SELECT instructor_id FROM public.courses
     WHERE id = (SELECT course_id FROM public.assignments WHERE id = assignment_id)
    ) = auth.uid()
  );

CREATE POLICY "submissions_insert_students"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "submissions_update_instructors"
  ON public.submissions FOR UPDATE
  USING (
    (SELECT instructor_id FROM public.courses
     WHERE id = (SELECT course_id FROM public.assignments WHERE id = assignment_id)
    ) = auth.uid()
  );

-- Microcredentials RLS Policies
CREATE POLICY "microcredentials_select_own"
  ON public.microcredentials FOR SELECT
  USING (
    student_id = auth.uid() OR
    (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid()
  );

CREATE POLICY "microcredentials_insert_system"
  ON public.microcredentials FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "microcredentials_update_instructors"
  ON public.microcredentials FOR UPDATE
  USING (
    (SELECT instructor_id FROM public.courses WHERE id = course_id) = auth.uid()
  );

-- Certificates RLS Policies
CREATE POLICY "certificates_select_own"
  ON public.certificates FOR SELECT
  USING (
    (SELECT student_id FROM public.microcredentials WHERE id = credential_id) = auth.uid() OR
    (SELECT instructor_id FROM public.courses
     WHERE id = (SELECT course_id FROM public.microcredentials WHERE id = credential_id)
    ) = auth.uid()
  );

CREATE POLICY "certificates_insert_system"
  ON public.certificates FOR INSERT
  WITH CHECK (true);
