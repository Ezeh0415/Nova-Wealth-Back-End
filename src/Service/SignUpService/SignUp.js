class SignUpService {
  constructor(UserModel) {
    this.UserModel = UserModel;
  }

  async signUp(user) {
    const newUser = new this.UserModel(user);
    return await newUser.save();
  }

  async checkUserExist(userName, email) {
    return await this.UserModel.findOne({ userName: userName, email: email });
  }

 
}

module.exports = SignUpService;
