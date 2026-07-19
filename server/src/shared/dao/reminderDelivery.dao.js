import ReminderDelivery from "../models/reminderDelivery.model.js";

const DEFAULT_POPULATE = "organizationId reminderId";

function isMongoSession(value) {
    return Boolean(value && typeof value === "object" && typeof value.inTransaction === "function");
}

function normalizeReadOptions(optionsOrSession, explicitSession) {
    if (isMongoSession(optionsOrSession)) {
        return { options: {}, session: optionsOrSession };
    }

    if (typeof optionsOrSession === "string" || Array.isArray(optionsOrSession)) {
        return {
            options: { populate: optionsOrSession },
            session: explicitSession,
        };
    }

    const options = optionsOrSession && typeof optionsOrSession === "object"
        ? optionsOrSession
        : {};

    return {
        options,
        session: options.session ?? explicitSession,
    };
}

function applyPopulate(query, options) {
    const populate = Object.prototype.hasOwnProperty.call(options, "populate")
        ? options.populate
        : DEFAULT_POPULATE;

    if (!populate) {
        return query;
    }

    if (Array.isArray(populate)) {
        for (const population of populate) {
            query = query.populate(population);
        }

        return query;
    }

    return query.populate(populate);
}

function applyReadOptions(query, options, session) {
    if (session) query = query.session(session);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip !== undefined) query = query.skip(options.skip);
    if (options.limit !== undefined) query = query.limit(options.limit);

    return applyPopulate(query, options);
}

class ReminderDeliveryDao {
    constructor() {
        this.Model = ReminderDelivery;
    }

    async create(data, session = null) {
        const delivery = new this.Model(data);
        return await delivery.save({ session });
    }

    async findById(id, optionsOrSession = {}, session = null) {
        const read = normalizeReadOptions(optionsOrSession, session);
        const query = applyReadOptions(this.Model.findById(id), read.options, read.session);
        return await query;
    }

    async findOne(filter, optionsOrSession = {}, session = null) {
        const read = normalizeReadOptions(optionsOrSession, session);
        const query = applyReadOptions(this.Model.findOne(filter), read.options, read.session);
        return await query;
    }

    async find(filter = {}, options = {}, session = null) {
        const read = normalizeReadOptions(options, session);
        const query = applyReadOptions(this.Model.find(filter), read.options, read.session);
        return await query;
    }

    async updateById(id, updateData, optionsOrSession = {}, session = null) {
        const read = normalizeReadOptions(optionsOrSession, session);
        let query = this.Model.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true,
            session: read.session,
        });

        query = applyPopulate(query, read.options);
        return await query;
    }

    async deleteById(id, session = null) {
        return await this.Model.findByIdAndDelete(id, { session });
    }

    async findForOrganization(organizationId, filter = {}, options = {}, session = null) {
        return await this.find(
            { ...filter, organizationId },
            options,
            session
        );
    }
}

export default ReminderDeliveryDao;
