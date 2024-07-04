import { authenticateLoginSalesforce, setSalesforceConnection, getUserFromSalesforce, authenticateSalesforce, updateSalesforcePassword, authenticateUser, isUserInSalesforce } from '../services/salesforceService.js'
import bcrypt from 'bcrypt';

const saltRounds = 10;

//login controller
//todo - set user object + call login after reset with new password.

export const login = async (req, res, next) => {
console.log('login reached');
const { username, password } = req.body;
console.log('username: ', username);
console.log('password: ', password);

try {
    //calls username-password authentication salesforce service to fetch initial access token required 
    const authenticateLoginSalesforceResponse = await authenticateLoginSalesforce();
    console.log('Salesforce login successful', authenticateLoginSalesforceResponse);
    //call setConnection to set temp token from response of un - pw salesforce authentication service
    //this created a new jsforce connection object and set the instantiated conn object's instanceUrl and access token, 
    //which will be used once to perform the getUserFromSalesforce service (uses conn) 
    setSalesforceConnection(authenticateLoginSalesforceResponse.accessToken, authenticateLoginSalesforceResponse.instanceUrl);
    //getUser with temp token set in service

    const user = await getUserFromSalesforce(username, password);
    console.log('user:', user);
    //check if user is in Beneficiaries db
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Authenticate with Salesforce to get the token for subsequent API calls using JWT - sets new conn object
    const {token} = await authenticateSalesforce();
    console.log('Salesforce JWT authentication in login successful:', token);

     // Check if the user needs to reset their password
     if (user.needsPasswordReset) {
      return res.status(200).json({ message: 'Password reset required', user, token, needsPasswordReset: true });
    }

    // Authentication successful
    res.status(200).json({ message: 'Login successful', user, token, needsPasswordReset: false });

} catch (error) {
  console.log(error);     
}
}

export const resetPassword = async (req, res, next) => {
  console.log('resetPassword reached');
  const { username, oldPassword, newPassword  } = req.body;
  console.log('username: ', username);
  console.log('oldPassword: ', oldPassword);
  console.log('newPassword: ', newPassword);

  try {
      const authenticateLoginSalesforceResponse = await authenticateLoginSalesforce();
      console.log('Salesforce login successful', authenticateLoginSalesforceResponse);

      setSalesforceConnection(authenticateLoginSalesforceResponse.accessToken, authenticateLoginSalesforceResponse.instanceUrl);

      const salesforceUser = await getUserFromSalesforce(username, oldPassword);
      console.log('user:', salesforceUser);

      if (!salesforceUser) {
          return res.status(404).json({ message: 'salesforceUser not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      console.log("hashedPassword of new pw:", hashedPassword);

      const updateResponse = await updateSalesforcePassword(salesforceUser.Id, hashedPassword);
      console.log('updateResponse:', updateResponse);

      const {user, token} = await authenticateUser(username, newPassword); //auth user calls get user, so resetpw can return user object
      res.status(200).json({ message: 'Password reset successful', user, token});
  } catch (error) {
      console.error('Error during password reset:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

export const forgotPassword = async (req, res, next) => {
  console.log('forgotPassword reached');
  const { username, newPassword } = req.body;
  console.log('username: ', username);
  console.log('newPassword: ', newPassword);

  try {
    const authenticateLoginSalesforceResponse = await authenticateLoginSalesforce();
    console.log('Salesforce login successful', authenticateLoginSalesforceResponse);

    setSalesforceConnection(authenticateLoginSalesforceResponse.accessToken, authenticateLoginSalesforceResponse.instanceUrl);

    const user = await isUserInSalesforce(username);
    console.log('user:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const updateResponse = await updateSalesforcePassword(user.Id, hashedPassword);
    console.log('updateResponse:', updateResponse);

    // Automatically log in the user with the new password
    const loginResponse = await authenticateUser(username, newPassword);
    res.status(200).json({ message: 'Password reset successful', user: loginResponse.user });

  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

