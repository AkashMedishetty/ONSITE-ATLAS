const roles = ['user', 'admin', 'manager', 'staff', 'sponsor', 'reviewer'];

const roleRights = new Map();
roleRights.set(roles[0], []);
roleRights.set(roles[1], ['getUsers', 'manageUsers', 'manageEvents', 'manageSettings', 'managePayments']);
roleRights.set(roles[2], ['manageEvents', 'manageRegistrations', 'manageResources', 'viewReports']);
roleRights.set(roles[3], ['viewRegistrations', 'scanQRCodes', 'checkInAttendees', 'trackResources']);
roleRights.set(roles[4], ['viewSponsorDashboard', 'manageSponsorProfile', 'viewLeads']);
roleRights.set('reviewer', ['viewAssignedAbstracts', 'submitAbstractReviews']);

module.exports = {
  roles,
  roleRights,
}; 