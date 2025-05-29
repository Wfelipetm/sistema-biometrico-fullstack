
const paginatedQuery = async ({ db, baseQuery, countQuery, values = [], page = 1, limit = 50 }) => {
    const offset = (page - 1) * limit;

    const pagedQuery = `${baseQuery} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const pagedValues = [...values, limit, offset];

    const [totalRes, dataRes] = await Promise.all([
        db.query(countQuery, values),
        db.query(pagedQuery, pagedValues)
    ]);

    return {
        total: parseInt(totalRes.rows[0].count),
        page,
        limit,
        data: dataRes.rows,
    };
};

module.exports = { paginatedQuery };
