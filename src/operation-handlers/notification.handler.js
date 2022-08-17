const ahw = require('../utils/async-handler-wrapper');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors');
const { notificationService } = require('../services');

const lib = {};


lib.getNotifsByUserId = ahw(async (req, res, next) => {
  let { pageNumber: page, pageSize: limit } = req.query;
  let result = await notificationService.selectWithPaging({ user: req.user._id }, { page, limit, sort: '-createdAt', populate: 'review' });
  if (!(result && result.items && result.items.length)) {
    throw new NotFoundError('Notifications not found');
  }

  res.send(result);
});


lib.setNotifsAsSeenByUserId = ahw(async (req, res, next) => {
  await notificationService.markAllAsSeen(req.user._id);
  res.status(204).send();
});


module.exports = lib;