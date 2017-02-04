/**
 * Created by Ivan on 03.02.17.
 * Substitute global process.exit function to our own; provides an ability to make async task before process exit;
 */
let exit = process.exit;

module.exports = function (cb) {
    process.exit = cb(exit);
};
