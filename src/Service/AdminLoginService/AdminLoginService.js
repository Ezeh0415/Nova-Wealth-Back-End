class AdminLogin {
    constructor(UserModel) {
        this.UserModel = UserModel;
    }

    async login(email) {
        return await this.UserModel.findOne({ email: email });
    }
}

module.exports = AdminLogin;