app.set("trust proxy", true);

const getUserIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

module.exports = getUserIp;
