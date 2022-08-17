const mongoosePaginate = require('mongoose-paginate-v2');

const plugin = (schema) => {
  schema.plugin(mongoosePaginate);

  /**
   * mongoose-paginate-v2. Basically its mongoose.find wrapped with pagination. Returns total and page counts.
   * @param {Object} query mongoose query object
   * @param {Object} [options] mongoose-paginate-v2 options (sort, select, populate, )
   * @param {number} [options.page] page number (default 1)
   * @param {number} [options.limit] page size (default 10)
   * @param {Object | string} [options.select] mongoose select
   * @param {Object | string} [options.sort] mongoose sort
   * @param {Array | Object | string} [options.populate] mongoose populate
   */
  schema.statics.paginate2 = async function (query, options = {}) {
    if (!options.page) options.page = 1;
    if (!options.limit) options.limit = 10;
    options.lean = true; // force lean
    options.customLabels = {
      docs: 'items',
      totalDocs: 'totalItems',
      page: 'pageNumber',
      limit: 'pageSize',
    }
    let data = await this.paginate(query, options);
    return data || [];
  }
};


module.exports = plugin;