class AdminSignUpService {
  constructor(UserModel) {
    this.UserModel = UserModel;
  }

  async signUp(user) {
    const newUser = new this.UserModel(user);
    return await newUser.save();
  }

  async checkUserExist( email) {
    return await this.UserModel.findOne({  email: email });
  }

 
}

module.exports = AdminSignUpService;