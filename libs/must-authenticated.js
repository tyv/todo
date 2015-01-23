module.exports = function (req, res, next){
  req.isAuthenticated()
    ? next()
    : res.status(401).end();
};