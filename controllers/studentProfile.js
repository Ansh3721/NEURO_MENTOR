const StudentProfile = require('../models/studentProfile');

const getInitials = (fullName = '') => {
  const words = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'SU';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const buildProfileViewModel = (profile) => {
  if (!profile) return null;

  const payload = profile.toObject ? profile.toObject() : { ...profile };
  payload.initials = getInitials(payload.fullName);

  const completionFields = [payload.fullName, payload.studentType];
  let totalFields = 2;
  let filledFields = completionFields.filter(Boolean).length;

  if (payload.studentType === 'School Student') {
    totalFields += 3;
    filledFields += [payload.schoolName, payload.currentClass, payload.board].filter(Boolean).length;
  } else if (payload.studentType === 'College Student') {
    totalFields += 5;
    filledFields += [payload.collegeName, payload.currentYear, payload.branch, payload.currentSemester, payload.streamDegree].filter(Boolean).length;
  }

  payload.completionPercent = Math.round((filledFields / totalFields) * 100);
  payload.institutionLabel = payload.studentType === 'School Student'
    ? payload.schoolName || 'Not Added Yet'
    : payload.collegeName || 'Not Added Yet';
  payload.academicSummary = payload.studentType === 'School Student'
    ? [payload.schoolName, payload.currentClass, payload.board].filter(Boolean).join(' • ') || 'Not Added Yet'
    : [payload.collegeName, payload.currentYear, payload.branch, payload.currentSemester, payload.streamDegree].filter(Boolean).join(' • ') || 'Not Added Yet';
  payload.notificationPreferences = {
    emailNotifications: payload.notificationPreferences?.emailNotifications ?? true,
    sessionReminders: payload.notificationPreferences?.sessionReminders ?? true,
    promotionalNotifications: payload.notificationPreferences?.promotionalNotifications ?? false,
  };
  payload.bookingSummary = {
    upcomingSessions: payload.bookingSummary?.upcomingSessions ?? 0,
    completedSessions: payload.bookingSummary?.completedSessions ?? 0,
    cancelledSessions: payload.bookingSummary?.cancelledSessions ?? 0,
  };

  return payload;
};

module.exports.new = async (req, res) => {
  const profile = req.user ? await StudentProfile.findOne({ owner: req.user._id }) : null;
  res.render('students/setup.ejs', { profile });
};

module.exports.create = async (req, res) => {
  const payload = req.body.studentProfile || req.body;
  const existing = req.user ? await StudentProfile.findOne({ owner: req.user._id }) : null;
  const profile = existing || new StudentProfile();

  Object.assign(profile, payload);

  if (req.user) {
    profile.owner = req.user._id;
  }

  if (req.file) {
    profile.profilePhoto = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  if (!profile.notificationPreferences) {
    profile.notificationPreferences = {
      emailNotifications: true,
      sessionReminders: true,
      promotionalNotifications: false,
    };
  }

  await profile.save();
  req.flash('success', existing ? 'Your profile has been updated.' : 'Your student profile has been created.');

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ success: true, profile: buildProfileViewModel(profile) });
  }

  res.redirect('/student-profile');
};

module.exports.show = async (req, res) => {
  try {
    const profile = req.user ? await StudentProfile.findOne({ owner: req.user._id }) : null;
    res.render('students/profile.ejs', { profile: buildProfileViewModel(profile), error: null });
  } catch (err) {
    console.error('Unable to load student profile:', err);
    res.render('students/profile.ejs', { profile: null, error: 'Unable to load your profile. Please try again.' });
  }
};

module.exports.update = async (req, res) => {
  const payload = req.body.studentProfile || req.body;
  const profile = req.user ? await StudentProfile.findOne({ owner: req.user._id }) : null;

  if (!profile) {
    const createdProfile = new StudentProfile(payload);
    createdProfile.owner = req.user._id;
    if (req.file) {
      createdProfile.profilePhoto = { url: req.file.path, filename: req.file.filename };
    }
    await createdProfile.save();
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, profile: buildProfileViewModel(createdProfile) });
    }
    return res.redirect('/student-profile');
  }

  Object.assign(profile, payload);

  if (req.file) {
    profile.profilePhoto = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  if (!profile.notificationPreferences) {
    profile.notificationPreferences = {
      emailNotifications: true,
      sessionReminders: true,
      promotionalNotifications: false,
    };
  }

  await profile.save();

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ success: true, profile: buildProfileViewModel(profile) });
  }

  req.flash('success', 'Your profile has been updated.');
  res.redirect('/student-profile');
};

module.exports.updatePhoto = async (req, res) => {
  const profile = req.user ? await StudentProfile.findOne({ owner: req.user._id }) : null;

  if (!profile) {
    return res.status(404).json({ success: false, message: 'No profile found.' });
  }

  if (req.file) {
    profile.profilePhoto = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  await profile.save();
  res.json({ success: true, profile: buildProfileViewModel(profile) });
};

module.exports.updatePreferences = async (req, res) => {
  const profile = req.user ? await StudentProfile.findOne({ owner: req.user._id }) : null;

  if (!profile) {
    return res.status(404).json({ success: false, message: 'No profile found.' });
  }

  profile.notificationPreferences = {
    emailNotifications: req.body.emailNotifications === 'on' || req.body.emailNotifications === true || req.body.emailNotifications === 'true',
    sessionReminders: req.body.sessionReminders === 'on' || req.body.sessionReminders === true || req.body.sessionReminders === 'true',
    promotionalNotifications: req.body.promotionalNotifications === 'on' || req.body.promotionalNotifications === true || req.body.promotionalNotifications === 'true',
  };

  await profile.save();
  res.json({ success: true, profile: buildProfileViewModel(profile) });
};

module.exports.destroy = async (req, res) => {
  await StudentProfile.deleteOne({ owner: req.user._id });
  req.flash('success', 'Your profile has been deleted.');
  res.redirect('/logout');
};
