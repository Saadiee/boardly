// * We can skip async handler by using "async/await" everytime we write a controller. It is just to make job easy so we don't have to write "async/await & try/catch" repeatedlt

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(function (err) {
      next(err);
    });
  };
}
export { asyncHandler };
