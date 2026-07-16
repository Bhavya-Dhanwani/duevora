// Importing modules
import mongoose from "mongoose";
import VendorDao from "../../../shared/dao/vendor.dao.js";
import Conflict from "../../../shared/errors/Conflict.error.js";
import NotFound from "../../../shared/errors/NotFound.error.js";
import BadRequest from "../../../shared/errors/BadRequest.error.js";
import Created from "../../../shared/responses/Created.response.js";
import Ok from "../../../shared/responses/Ok.response.js";

// class to handle vendor operations
class VendorsController {

    constructor() {

        // initializing the vendor dao
        this.vendorDao = new VendorDao();

    }

    // create a new vendor
    createVendor = async (req, res) => {

        const { name, email, phone, address, taxNumber, status } = req.body;
        const organizationId = req.user.organizationId;

        // if email is provided, verifying that it is unique within the organization context
        if (email) {

            const existingVendor = await this.vendorDao.findOne({
                organizationId,
                email: email.toLowerCase(),
                isDeleted: {
                    $ne: true
                }
            });

            if (existingVendor) {

                throw new Conflict("Vendor with this email already exists in your organization.");

            }

        }

        // creating the vendor using the vendor dao
        const vendor = await this.vendorDao.create({
            organizationId,
            name,
            email: email ? email.toLowerCase() : undefined,
            phone: phone || "",
            address: address || "",
            taxNumber: taxNumber || "",
            status: status || "active",
            isDeleted: false
        });

        return Created(res, "Vendor profile created successfully", vendor);

    }

    // list vendors with pagination, sorting, and search
    listVendors = async (req, res) => {

        const organizationId = req.user.organizationId;

        // formulating vendor filter based on organization isolation and excluding soft deleted vendors
        const filter = {
            organizationId,
            isDeleted: {
                $ne: true
            }
        };

        // checking if search query is provided
        if (req.query.search) {

            const searchRegex = {
                $regex: req.query.search,
                $options: "i"
            };

            filter.$or = [
                { name: searchRegex },
                { email: searchRegex }
            ];

        }

        // parsing pagination and sorting parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

        // counting total records matching filter using the underlying mongoose model
        const total = await this.vendorDao.Model.countDocuments(filter);

        // fetching vendors using vendor dao
        const vendors = await this.vendorDao.find(filter, {
            sort: { [sortBy]: sortOrder },
            limit,
            skip
        });

        // constructing pagination metadata
        const pages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Vendors retrieved successfully",
            data: vendors,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });

    }

    // get vendor details by id
    getVendorDetails = async (req, res) => {

        const { vendorId } = req.params;
        const organizationId = req.user.organizationId;

        // finding the vendor profile within the organization context and excluding soft deleted vendors
        const vendor = await this.vendorDao.findOne({
            _id: vendorId,
            organizationId,
            isDeleted: {
                $ne: true
            }
        });

        if (!vendor) {

            throw new NotFound("Vendor profile not found in your organization.");

        }

        return Ok(res, "Vendor details retrieved successfully", vendor);

    }

    // update vendor profile details
    updateVendor = async (req, res) => {

        const { vendorId } = req.params;
        const { name, email, phone, address, taxNumber, status } = req.body;
        const organizationId = req.user.organizationId;

        // verifying target vendor belongs to caller's organization context
        const vendor = await this.vendorDao.findOne({
            _id: vendorId,
            organizationId,
            isDeleted: {
                $ne: true
            }
        });

        if (!vendor) {

            throw new NotFound("Vendor profile not found in your organization.");

        }

        // if email is updated, verifying that it is unique within the organization context
        if (email && email.toLowerCase() !== vendor.email) {

            const existingVendor = await this.vendorDao.findOne({
                organizationId,
                email: email.toLowerCase(),
                _id: {
                    $ne: vendorId
                },
                isDeleted: {
                    $ne: true
                }
            });

            if (existingVendor) {

                throw new Conflict("Vendor with this email already exists in your organization.");

            }

        }

        // updating vendor record using vendor dao
        const updatedVendor = await this.vendorDao.updateById(vendorId, {
            name: name !== undefined ? name : vendor.name,
            email: email !== undefined ? email.toLowerCase() : vendor.email,
            phone: phone !== undefined ? phone : vendor.phone,
            address: address !== undefined ? address : vendor.address,
            taxNumber: taxNumber !== undefined ? taxNumber : vendor.taxNumber,
            status: status !== undefined ? status : vendor.status
        });

        return Ok(res, "Vendor profile updated successfully", updatedVendor);

    }

    // soft delete a vendor profile
    deleteVendor = async (req, res) => {

        const { vendorId } = req.params;
        const organizationId = req.user.organizationId;

        // verifying target vendor belongs to caller's organization context and excluding soft deleted vendors
        const vendor = await this.vendorDao.findOne({
            _id: vendorId,
            organizationId,
            isDeleted: {
                $ne: true
            }
        });

        if (!vendor) {

            throw new NotFound("Vendor profile not found in your organization.");

        }

        // soft deleting vendor by setting isDeleted to true
        await this.vendorDao.updateById(vendorId, {
            isDeleted: true
        });

        return Ok(res, "Vendor profile deleted successfully");

    }

    // bulk import vendors using database replica transactions
    bulkImportVendors = async (req, res) => {

        const { vendors } = req.body;
        const organizationId = req.user.organizationId;

        // tracking unique emails in the input payload to check for local duplicates
        const inputEmails = new Set();

        for (const vend of vendors) {

            if (vend.email) {

                const lowerEmail = vend.email.toLowerCase();

                if (inputEmails.has(lowerEmail)) {

                    throw new BadRequest(`Duplicate email found in import list: ${vend.email}`);

                }

                inputEmails.add(lowerEmail);

            }

        }

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const importedVendors = [];

            for (const vend of vendors) {

                // verifying that email is unique within organization context if provided
                if (vend.email) {

                    const existingVendor = await this.vendorDao.findOne({
                        organizationId,
                        email: vend.email.toLowerCase(),
                        isDeleted: {
                            $ne: true
                        }
                    }, session);

                    if (existingVendor) {

                        throw new Conflict(`Vendor with email ${vend.email} already exists.`);

                    }

                }

                // creating vendor record using vendor dao
                const createdVend = await this.vendorDao.create({
                    organizationId,
                    name: vend.name,
                    email: vend.email ? vend.email.toLowerCase() : undefined,
                    phone: vend.phone || "",
                    address: vend.address || "",
                    taxNumber: vend.taxNumber || "",
                    status: vend.status || "active",
                    isDeleted: false
                }, session);

                importedVendors.push(createdVend);

            }

            // committing transaction and saving all documents
            await session.commitTransaction();

            return Created(res, "Vendors imported successfully", importedVendors);

        } catch (error) {

            // aborting transaction on any failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending the session
            session.endSession();

        }

    }

    // bulk update vendors using database replica transactions
    bulkUpdateVendors = async (req, res) => {

        const { vendorIds, updateData } = req.body;
        const organizationId = req.user.organizationId;

        // starting a mongodb transaction session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const updatedVendors = [];

            for (const vendorId of vendorIds) {

                // verifying target vendor belongs to caller's organization context
                const vendor = await this.vendorDao.findOne({
                    _id: vendorId,
                    organizationId,
                    isDeleted: {
                        $ne: true
                    }
                }, session);

                if (!vendor) {

                    throw new NotFound(`Vendor profile with ID ${vendorId} not found in your organization.`);

                }

                // updating vendor record using vendor dao
                const updatedVend = await this.vendorDao.updateById(vendorId, {
                    status: updateData.status !== undefined ? updateData.status : vendor.status,
                    address: updateData.address !== undefined ? updateData.address : vendor.address
                }, session);

                updatedVendors.push(updatedVend);

            }

            // committing transaction
            await session.commitTransaction();

            return Ok(res, "Vendors updated successfully", updatedVendors);

        } catch (error) {

            // aborting transaction on failure
            await session.abortTransaction();
            throw error;

        } finally {

            // ending session
            session.endSession();

        }

    }

}

export default VendorsController;
