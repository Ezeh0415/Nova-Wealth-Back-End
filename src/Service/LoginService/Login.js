class Login {
    constructor(UserModel) {
        this.UserModel = UserModel;
    }

    async login(userName) {
        return await this.UserModel.findOne({ userName: userName });
    }
}

module.exports = Login;