// Service for handling DMCA takedown requests (Digital Millennium Copyright Act)

const fs = require('fs');
const path = require('path');

class DMCAService {
  constructor(submissionsDir, submissionsService, emailService, gamesDir, options = {}) {
    this.dmcaFile = options.dmcaFile || path.join(__dirname, '../.dmca_requests.json');
    this.submissionsDir = submissionsDir;
    this.submissionsService = submissionsService;
    this.emailService = emailService;
    this.gamesDir = gamesDir;
    this.notifiedUsersFile = options.notifiedUsersFile || path.join(__dirname, '../.dmca_notified_users.json');

    // Ensure DMCA requests file exists
    if (!fs.existsSync(this.dmcaFile)) {
      fs.writeFileSync(this.dmcaFile, JSON.stringify([], null, 2));
    }

    // Ensure notified users file exists (for repeat offender tracking)
    if (!fs.existsSync(this.notifiedUsersFile)) {
      fs.writeFileSync(this.notifiedUsersFile, JSON.stringify([], null, 2));
    }
  }

  // Get all DMCA requests
  getAllRequests() {
    try {
      const data = fs.readFileSync(this.dmcaFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading DMCA requests:', error);
      return [];
    }
  }

  // Save DMCA requests
  saveRequests(requests) {
    try {
      fs.writeFileSync(this.dmcaFile, JSON.stringify(requests, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving DMCA requests:', error);
      return false;
    }
  }

  // Save notified users (for repeat offender tracking)
  saveNotifiedUsers(users) {
    try {
      // Remove circular references before saving
      const cleanedUsers = users.map(u => ({
        email: u.email,
        notifiedAt: u.notifiedAt,
        reason: u.reason,
        totalNotifications: u.totalNotifications,
        lastNotification: u.lastNotification,
        notifications: u.notifications ? u.notifications.map(n => ({
          email: n.email,
          notifiedAt: n.notifiedAt,
          reason: n.reason,
          totalNotifications: n.totalNotifications
        })) : []
      }));
      fs.writeFileSync(this.notifiedUsersFile, JSON.stringify(cleanedUsers, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving notified users:', error);
      return false;
    }
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Create a new DMCA request
  createRequest(requestData) {
    const requests = this.getAllRequests();

    const newRequest = {
      id: this.generateId(),
      complainantName: requestData.complainantName || '',
      complainantEmail: requestData.complainantEmail || '',
      complainantPhone: requestData.complainantPhone || '',
      complainantAddress: requestData.complainantAddress || '',
      copyrightWork: requestData.copyrightWork || '',
      infringingUrl: requestData.infringingUrl || '',
      infringingTitle: requestData.infringingTitle || '',
      goodFaithBelief: requestData.goodFaithBelief || false,
      accuracyStatement: requestData.accuracyStatement || false,
      underPenaltyPerjury: requestData.underPenaltyPerjury || false,
      signature: requestData.signature || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      processedAt: null,
      processedBy: null,
      notes: '',
      actionTaken: null,
      contentRemoved: false
    };

    requests.push(newRequest);
    this.saveRequests(requests);
    return newRequest;
  }

  // Check if user is a repeat offender
  isRepeatOffender(submitterEmail) {
    const notifiedUsers = JSON.parse(fs.readFileSync(this.notifiedUsersFile, 'utf8'));
    const user = notifiedUsers.find(u => u.email.toLowerCase() === submitterEmail.toLowerCase());
    return user || null;
  }

  // Record user notification for repeat offender tracking
  recordUserNotification(email, reason) {
    const notifiedUsers = JSON.parse(fs.readFileSync(this.notifiedUsersFile, 'utf8'));

    const existingIndex = notifiedUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    const notificationRecord = {
      email: email.toLowerCase(),
      notifiedAt: new Date().toISOString(),
      reason: reason,
      totalNotifications: 1
    };

    if (existingIndex !== -1) {
      notifiedUsers[existingIndex].totalNotifications++;
      notifiedUsers[existingIndex].lastNotification = notificationRecord.notifiedAt;
      if (!notifiedUsers[existingIndex].notifications) {
        notifiedUsers[existingIndex].notifications = [];
      }
      notifiedUsers[existingIndex].notifications.push(notificationRecord);
    } else {
      notificationRecord.notifications = [notificationRecord];
      notifiedUsers.push(notificationRecord);
    }

    this.saveNotifiedUsers(notifiedUsers);
    return notifiedUsers.find(u => u.email === email.toLowerCase());
  }

  // Update DMCA request status
  updateRequest(id, updates) {
    const requests = this.getAllRequests();
    const index = requests.findIndex(r => r.id === id);

    if (index === -1) {
      return null;
    }

    const request = requests[index];
    Object.assign(request, updates);
    request.updatedAt = new Date().toISOString();

    this.saveRequests(requests);
    return request;
  }

  // Process DMCA request - remove infringing content
  processRequest(id, adminEmail) {
    const request = this.getAllRequests().find(r => r.id === id);

    if (!request) {
      return { success: false, error: 'DMCA request not found' };
    }

    // Update request to processing status
    this.updateRequest(id, {
      status: 'processing',
      processedBy: adminEmail,
      processedAt: new Date().toISOString()
    });

    try {
      // Find infringing submission by title
      const submissions = this.submissionsService.getAllSubmissions();
      const infringingSubmission = submissions.find(s => s.title === request.infringingTitle);

      if (!infringingSubmission) {
        this.updateRequest(id, {
          status: 'completed',
          actionTaken: 'no_matching_submission',
          notes: 'No matching submission found for the reported content'
        });
        return { success: true, results: { contentRemoved: false, reason: 'no_matching_submission' } };
      }

      // Check if submitter is a repeat offender
      const repeatOffender = this.isRepeatOffender(infringingSubmission.email);
      const severity = repeatOffender ? 'high' : 'normal';

      // Get the full submission object with path validation
      const submissionPath = path.join(this.submissionsDir, `${infringingSubmission.id}.json`);
      const resolvedPath = path.resolve(submissionPath);
      const resolvedSubmissionsDir = path.resolve(this.submissionsDir);

      // Validate path to prevent traversal
      if (!resolvedPath.startsWith(resolvedSubmissionsDir)) {
        return { success: false, error: 'Invalid submission path' };
      }

      if (fs.existsSync(submissionPath)) {
        // Delete the submission file
        fs.unlinkSync(submissionPath);

        // Update submissions list
        const filteredSubmissions = submissions.filter(s => s.id !== infringingSubmission.id);
        this.submissionsService.saveSubmissions(filteredSubmissions);
      }

      // Record notification for repeat offender tracking
      if (!repeatOffender) {
        this.recordUserNotification(infringingSubmission.email, 'DMCA takedown notice');
      }

      // Send notification email to submitter
      if (this.emailService) {
        try {
          const emailSent = this.emailService.sendEmail({
            to: infringingSubmission.email,
            subject: 'DMCA Takedown Notice - Content Removed',
            body: this.generateSubmitterNotificationEmail(infringingSubmission, request, repeatOffender)
          });
        } catch (emailError) {
          console.error('Failed to send submitter notification email:', emailError);
        }
      }

      // Update request status
      this.updateRequest(id, {
        status: 'completed',
        actionTaken: 'content_removed',
        contentRemoved: true,
        severity: severity,
        notes: `Content removed. ${repeatOffender ? 'Submitter is a repeat offender.' : 'First DMCA notice for this user.'}`
      });

      return { success: true, results: { contentRemoved: true, repeatOffender } };
    } catch (error) {
      console.error('Error processing DMCA request:', error);
      this.updateRequest(id, {
        status: 'error',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  // Generate email to submitter whose content was removed
  generateSubmitterNotificationEmail(submission, dmcaRequest, repeatOffender) {
    // Note: subject is returned via separate method, this returns the body only

    return `Dear Content Creator,

This notice is to inform you that content titled "${submission.title}" has been removed from Best Version due to a valid DMCA takedown request.

DETAILS OF THE REMOVAL:

DMCA Request ID: ${dmcaRequest.id}
Date of Removal: ${new Date().toLocaleDateString()}
Reason: Copyright infringement claim

IF THIS IS A REPEAT OFFENDER NOTICE AND YOU BELIEVE THIS IS IN ERROR:

You have received multiple DMCA notices from Best Version. If you believe this removal was made in error, you may file a counter-notice pursuant to 17 U.S.C. § 512(g)(3).

COUNTER-NOTICE PROCESS:

If you believe your content was mistakenly identified as infringing, you may submit a counter-notice containing:
1. Your physical or electronic signature
2. Identification of the removed content and its previous location
3. Statement made under penalty of perjury that you have good faith belief the material was removed by mistake or misidentification
4. Your name, address, and telephone number
5. Statement consenting to jurisdiction of the Federal District Court

Please send your counter-notice to: report@best-version.com

ACTIONS TAKEN:

The infringing content has been removed from our platform. Your submission record has been archived and is no longer publicly visible.

SUPPORT:

If you have any questions about this notice, please contact us at: report@best-version.com

Sincerely,
The Best Version Team

---
Best Version - Your guide to playing retro games on modern devices
${process.env.BASE_URL || 'http://localhost:3000'}
`;
  }

  // Generate email template for complainant acknowledgment
  generateComplainantAcknowledgmentEmail(dmcaRequest) {
    const subject = 'DMCA Takedown Request Received - Best Version';

    return `Dear ${dmcaRequest.complainantName},

This email confirms that we have received your DMCA takedown request.

REQUEST DETAILS:

Request ID: ${dmcaRequest.id}
Submission Date: ${new Date(dmcaRequest.createdAt).toLocaleDateString()}
Reported Content: ${dmcaRequest.infringingTitle}
Copyrighted Work: ${dmcaRequest.copyrightWork}

PROCESSING TIMELINE:

We will review your request within 2-3 business days and take appropriate action. You will receive a follow-up email once the request has been processed.

NEXT STEPS:

1. We will review the validity of your DMCA claim
2. If valid, the reported content will be removed
3. The submitting user will be notified of the takedown
4. You may receive a counter-notice if the user contests the removal

REFERENCE INFORMATION:

Please retain this email and the Request ID above for your records. If you need to follow up on this request, please reference the Request ID when contacting us.

CONTACT:

If you have any questions, please contact us at: report@best-version.com

Sincerely,
The Best Version Team

---
Best Version - Your guide to playing retro games on modern devices
${process.env.BASE_URL || 'http://localhost:3000'}
`;
  }

  // Send acknowledgment email to complainant
  sendAcknowledgmentEmail(dmcaRequestId) {
    const request = this.getAllRequests().find(r => r.id === dmcaRequestId);

    if (!request || request.status !== 'pending') {
      return { success: false, error: 'Invalid DMCA request' };
    }

    try {
      const emailSent = this.emailService.sendEmail({
        to: request.complainantEmail,
        subject: 'DMCA Takedown Request Received - Best Version',
        body: this.generateComplainantAcknowledgmentEmail(request)
      });

      if (!emailSent) {
        console.warn('Acknowledge email sent in mock mode or failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending acknowledgment email:', error);
      return { success: false, error: error.message };
    }
  }

  // Get statistics
  getStatistics() {
    const requests = this.getAllRequests();
    const repeatOffenders = JSON.parse(fs.readFileSync(this.notifiedUsersFile, 'utf8'));

    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      processing: requests.filter(r => r.status === 'processing').length,
      completed: requests.filter(r => r.status === 'completed').length,
      error: requests.filter(r => r.status === 'error').length,
      repeatOffenders: repeatOffenders.length,
      contentRemoved: requests.filter(r => r.contentRemoved === true).length
    };
  }

  // Get request by ID
  getRequestById(id) {
    const requests = this.getAllRequests();
    return requests.find(r => r.id === id) || null;
  }

  // Get repeat offenders list
  getRepeatOffenders() {
    return JSON.parse(fs.readFileSync(this.notifiedUsersFile, 'utf8'));
  }
}

module.exports = { DMCAService };
