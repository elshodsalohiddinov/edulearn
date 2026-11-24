// Kutilgan (biznes) xatolar uchun klass. Controller ichida `throw ApiError.notFound('...')`
// deyilsa, errorHandler uni to'g'ri HTTP status kod va yagona JSON formatda qaytaradi.
class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  static badRequest(message = 'So\'rov noto\'g\'ri', errors) { return new ApiError(400, message, errors); }
  static unauthorized(message = 'Avval tizimga kiring') { return new ApiError(401, message); }
  static forbidden(message = 'Bu amal uchun ruxsatingiz yo\'q') { return new ApiError(403, message); }
  static notFound(message = 'Topilmadi') { return new ApiError(404, message); }
  static conflict(message = 'Bunday ma\'lumot allaqachon mavjud') { return new ApiError(409, message); }
  static unprocessable(message = 'Ma\'lumotlar noto\'g\'ri', errors) { return new ApiError(422, message, errors); }
}

module.exports = ApiError;
