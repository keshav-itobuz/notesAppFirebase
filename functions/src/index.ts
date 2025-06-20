import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as nodemailer from 'nodemailer';
import * as logger from 'firebase-functions/logger';
import { auth } from './config/initialiseResources';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kkeshavkumar1209@gmail.com',
    pass: 'mbvwkbqzaokazbwu',
  },
});

export const sendDailyEmails = onSchedule('* * * * *', async () => {
  try {
    const users = await auth.listUsers();
    const sentEmails: string[] = [];

    for (const user of users.users) {
      if (user.email) {
        try {
          const info = await transporter.sendMail({
            from: '"Firebase App" <kkeshavkumar1209@gmail.com>',
            to: user.email,
            subject: 'Daily Update from Firebase!',
            html: `<h1>Hello ${user.displayName || 'User'}!</h1>
                   <p>This is your daily automated email.</p>`,
          });

          logger.info(`Email sent to ${user.email}`, info.messageId);
          sentEmails.push(user.email);

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.error(`Failed to send to ${user.email}:`, error);
        }
      }
    }

    logger.info(`Successfully sent ${sentEmails.length} emails`);
  } catch (error) {
    logger.error('Critical error in sendDailyEmails:', error);
    throw error;
  }
});
