export function asyncHandler(requestHaldler) {
  return function (req, res, next) {
    Promise.resolve(requestHaldler(req, res, next)).catch(function (err) {
      next(err);
    });
  };
}
