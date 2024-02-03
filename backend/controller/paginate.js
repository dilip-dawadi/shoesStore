export class APIfeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.paginate = queryString;
    }
    filtering() {
        const queryObj = { ...this.queryString };
        if (queryObj.price) {
            const priceRange = queryObj.price.split(" - ");
            queryObj.price = `${parseInt(priceRange[0], 10)} - ${parseInt(priceRange[1], 10)}`;
        }
        if (queryObj.brand) {
            queryObj.brand = queryObj.brand; // Remove the object assignment
        }
        const excludedFields = ["page", "sort", "limit"];
        excludedFields.forEach((el) => delete queryObj[el]);
        if (queryObj.brand && queryObj.category && queryObj.price) {
            this.query.find(queryObj);
            this.queryString = queryObj;
            return this;
        }
        else if (!queryObj.brand && queryObj.category && queryObj.price) {
            delete queryObj.brand;
            this.queryString = queryObj;
            this.query.find(queryObj);
            return this;
        }
        else if (queryObj.brand && !queryObj.category && queryObj.price) {
            delete queryObj.category;
            this.queryString = queryObj;
            this.query.find(queryObj);
            return this;
        }
        else if (queryObj.brand && queryObj.category && !queryObj.price) {
            delete queryObj.price;
            this.queryString = queryObj;
            this.query.find(queryObj);
            return this;
        }
        else if (!queryObj.brand && !queryObj.category && queryObj.price) {
            delete queryObj.brand;
            delete queryObj.category;
            this.queryString = queryObj;
            this.query.find(queryObj);
            return this;
        }
        else if (!queryObj.brand && queryObj.category && !queryObj.price) {
            delete queryObj.brand;
            delete queryObj.price;
            this.queryString = queryObj;
            this.query.find(queryObj);
            return this;
        }
        else if (queryObj.brand && !queryObj.category && !queryObj.price) {
            delete queryObj.category;
            delete queryObj.price;
            this.queryString = queryObj;
            this.query.find(queryObj);
            return this;
        }
        else {
            this.queryString = {};
            this.query.find();
            return this;
        }
    }
    sorting() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort;
            this.query = this.query.sort(sortBy);
        }
        else {
            this.query = this.query.sort("-createdAt");
        }
        return this;
    }
    paginating() {
        const page = this.paginate.page !== undefined ? this.paginate.page : 1;
        const limit = this.paginate.limit !== undefined ? this.paginate.limit : 8;
        const skip = this.paginate.skip !== undefined
            ? this.paginate.skip
            : (page - 1) * limit;
        this.paginate = { ...this.paginate, skip, limit };
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
