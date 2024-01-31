import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: String, token: String, keepLoggedIn: Boolean });
const UserSession = mongoose.model('UserSession', schema);
export default UserSession;
