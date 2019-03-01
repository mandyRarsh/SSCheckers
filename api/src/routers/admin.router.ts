import { Router } from 'express';
import { AdminService } from '../services/admin.service';
import { User, UserResponse } from '../models/Player';
import { tokenGuard } from '../middlewares/token-guard';
import { PermissionType } from '../models/Permission';
import { ResourceNotFoundError } from '../models/Error';
import { Customer } from '../models/Customer';
import { Venue } from '../models/Venue';
import { Role, RoleResponse } from '../models/Role';

export const adminRouter = Router();
const adminService = new AdminService();

// Read user
adminRouter.get('/users', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let userId = req.query.userId;
    let venueId = req.query.venueId;
    let custId = req.query.customerId;
    // Return all allowed users if no context specified
    if (!userId && !venueId && !custId) {
        adminService.getAllAccessibleUsers(reqUser)
        .then( us => {
            try {
                let users = [];
                // Check that user is able to view all returned users
                for (let u of us) {
                    reqUser.hasPermission(PermissionType.USERS_READ, u.customerId, u.defaultVenueId)
                    users.push(u.toResponse());
                }
                res.send(users);
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(500).send({message: err.message})
        })
    }
    // Get the specified user if an ID is passed
    else if (userId) {
        adminService.getUserById(userId)
        .then( u => {
            try {
                 // Make sure the requesting user has permission to view found user
                if (u && reqUser.hasPermission(PermissionType.USERS_READ, u.customerId, u.defaultVenueId)) {
                    res.send(u.toResponse());
                } else {
                    throw new ResourceNotFoundError(`user_id ${userId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(500).send({message: err.message})
        })
    // Get all users within a specified venueId
    } else if (venueId) {
        adminService.getUsersByVenue(venueId)
        .then( us => {
            try {
                 // Make sure the requesting user has permission to view found users of venue
                if (us && reqUser.hasPermission(PermissionType.USERS_READ, reqUser.customer.customerId, venueId)) {
                    let users = []
                    for (let user of us) {
                        users.push(user.toResponse());
                    }
                    res.send(users);
                } else {
                    throw new ResourceNotFoundError(`users with venue_id ${venueId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(500).send({message: err.message})
        })
    } else if (custId) {
        adminService.getUsersByCustomer(custId)
        .then( us => {
            try {
                 // Make sure the requesting user has permission to view found users of customer (no venue level users)
                if (us && reqUser.hasPermission(PermissionType.USERS_READ, custId)) {
                    let users = []
                    for (let user of us) {
                        users.push(user.toResponse());
                    }
                    res.send(users);
                } else {
                    throw new ResourceNotFoundError(`users with customer_id ${custId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(500).send({message: err.message})
        })
    } 
});

// Create/Update user
adminRouter.post('/saveUser', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let saveUser = new User(req.body.user);
    saveUser.defaultVenueId = req.body.user.defaultVenue.venueId;
    saveUser.customerId = req.body.user.customer.customerId;
    saveUser.role = [];
    saveUser.role[0] = req.body.user.role[0];
    adminService.getUserById(req.body.user.userId)
        .then( u => {
            try {
                // Update existing found user
                if (u && reqUser.hasPermission(PermissionType.USERS_UPDATE, u.customerId, u.defaultVenueId)) {
                    adminService.updateUser(u, saveUser)
                        .then( updatedUser => {
                            res.send(updatedUser.toResponse());
                        }).catch(err => {
                            res.status(401).send({message: err.message});
                        })
                // Create new user
                } else if (!u && reqUser.hasPermission(PermissionType.USERS_CREATE, saveUser.customerId, saveUser.defaultVenueId)) {
                    adminService.createUser(saveUser)
                        .then( (newUser: User) => {
                            let savedUser = newUser.toResponse();
                            res.send(savedUser);
                        // Could not save user
                        }).catch( err => {
                            res.status(401).send({message: err.message});
                        })
                // Wut?
                } else res.status(401).send();
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    })

// Read customer
adminRouter.get('/customers', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let custId = req.query.customerId;
    if (custId) {
        let customer = [];
        adminService.getCustomerById(custId)
            .then( c => {
                try {
                    // Make sure the requesting user has permission to view found customer
                    if (c && reqUser.hasPermission(PermissionType.CUSTOMERS_READ, custId)) {
                        customer.push(c.toResponse());
                        res.send(customer);
                    } else {
                        throw new ResourceNotFoundError(`customer ${custId}`);
                    }
                } catch (err) {
                    res.status(err.httpStatusCode).send({message: err.message})
                }
            }).catch( err => {
                res.status(401).send({message: err.message})
            })
    } else {
        adminService.getAllCustomers()
            .then( cs => {
                try {
                    // Make sure the requesting user has system level read_customers 
                    if (cs && reqUser.hasPermission(PermissionType.CUSTOMERS_READ)) {
                        let customers = [];
                        for (let customer of cs) {
                            customers.push(customer.toResponse());
                        }
                        res.send(customers);
                    } else {
                        throw new ResourceNotFoundError(`all customers`);
                    }
                } catch (err) {
                    res.status(err.httpStatusCode).send({message: err.message})
                }
            }).catch( err => {
                res.status(401).send({message: err.message})
            })
    }
});

// Create/Update customer
adminRouter.post('/saveCustomer', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let saveCust: Customer = req.body.customer;
    adminService.getCustomerById(saveCust.customerId)
        .then( c => {
            try {
                // Update existing found customer (no venue users can edit this)
                if (c && reqUser.hasPermission(PermissionType.CUSTOMERS_UPDATE, c.customerId)) {
                    adminService.updateCustomer(c, saveCust)
                        .then( updatedCustomer => {
                            res.send(updatedCustomer.toResponse());
                        }).catch( err => {
                            res.status(err.httpStatusCode ? err.httpStatusCode : 500).send({message: err.message});
                        })
                // Create new customer (only system level)
                } else if (!c && reqUser.hasPermission(PermissionType.CUSTOMERS_CREATE)) {
                    adminService.createCustomer(saveCust)
                        .then( (newCustomer: Customer) => {
                            let savedCustomer = newCustomer.toResponse();
                            res.send(savedCustomer);
                        // Could not save user
                        }).catch( err => {
                            res.status(err.httpStatusCode).send({message: err.message});
                        })
                // Wut?
                } else res.status(401).send();
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    })

// Read venue
adminRouter.get('/venues/', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let custId = req.query.customerId;
    let venueId = req.query.venueId;

    if (venueId) {
        let venue = [];
        adminService.getVenueById(venueId)
        .then( v => {
            try {
                 // Make sure the requesting user has permission to view found venue
                if (v && reqUser.hasPermission(PermissionType.VENUES_READ, v.venueCustomerId, venueId)) {
                    venue.push(v.toResponse());
                    res.send(venue);
                } else {
                    throw new ResourceNotFoundError(`venue_id ${venueId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    } else if (custId) {
        adminService.getVenuesByCustomer(custId)
        .then( vs => {
            try {
                 // Make sure the requesting user has permission to view found venue(s)
                if (vs && reqUser.hasPermission(PermissionType.VENUES_READ, custId)) {
                    let venues = [];
                    for (let venue of vs) {
                        venues.push(venue.toResponse());
                    }
                    res.send(venues);
                } else {
                    throw new ResourceNotFoundError(`venues with customer_id ${custId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    } else {
        adminService.getAllVenues()
        .then( vs => {
            try {
                 // Make sure the requesting user has permission to view found venue(s)
                if (vs && reqUser.hasPermission(PermissionType.VENUES_READ)) {
                    let venues = [];
                    for (let venue of vs) {
                        venues.push(venue.toResponse());
                    }
                    res.send(venues);
                } else {
                    throw new ResourceNotFoundError(`venues with customer_id ${custId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    }   
})

// Create/Update venue
adminRouter.post('/saveVenue', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let saveVenue: Venue = req.body.venue;
    adminService.getVenueById(saveVenue.venueId)
        .then( v => {
            try {
                // Update existing found venue 
                if (v && reqUser.hasPermission(PermissionType.VENUES_UPDATE, v.venueCustomerId, v.venueId)) {
                    adminService.updateVenue(v, saveVenue)
                        .then( updatedVenue => {
                            res.send(updatedVenue.toResponse());
                        })
                // Create new venue (no venue level users)
                } else if (!v && reqUser.hasPermission(PermissionType.VENUES_CREATE, saveVenue.venueCustomerId)) {
                    adminService.createVenue(saveVenue)
                        .then( (newVenue: Venue) => {
                            let savedVenue = newVenue.toResponse();
                            res.send(savedVenue);
                        // Could not save venue
                        }).catch( err => {
                            res.status(401).send({message: err.message});
                        })
                // Wut?
                } else res.status(401).send();
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    })

// Read roles
adminRouter.get('/roles/', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let custId = req.query.customerId;
    let venueId = req.query.venueId;

    if (venueId) {
        adminService.getRolesByVenue(venueId)
        .then( rs => {
            try {
                 // Make sure the requesting user has permission to view found venue
                 // TODO: Roles need to save customer and venue ID if they are a venue only role
                if (rs && reqUser.hasPermission(PermissionType.USERS_READ, rs[0].customerId, rs[0].venueId)) {
                    let roles: RoleResponse[] = [];
                    for (let role of rs) {
                        roles.push(role.toResponse())
                    }
                    res.send(roles);
                } else {
                    throw new ResourceNotFoundError(`roles for venue ${venueId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    } else if (custId) {
        adminService.getRolesByCustomer(custId, reqUser.role[0].isSuperAdmin)
        .then( rs => {
            try {
                 if (rs && reqUser.hasPermission(PermissionType.USERS_READ, rs[0].customerId)) {
                    let roles: RoleResponse[] = [];
                    for (let role of rs) {
                        roles.push(role.toResponse())
                    }
                    res.send(roles);
                } else {
                    throw new ResourceNotFoundError(`roles for customer ${custId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    } else {
        adminService.getAllRoles()
        .then( rs => {
            try {
                 if (rs && reqUser.hasPermission(PermissionType.USERS_READ)) {
                    let roles: RoleResponse[] = [];
                    for (let role of rs) {
                        roles.push(role.toResponse())
                    }
                    res.send(roles);
                } else {
                    throw new ResourceNotFoundError(`roles for customer ${custId}`);
                }
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    }   
})

adminRouter.get('/permissions', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    adminService.getPermissions()
    .then( ps => {
        try {
            if (ps && reqUser.hasPermission(PermissionType.USERS_READ)) {
                let rP = [];
                for (let p of ps) {
                    rP.push(p.toResponse())
                }
                res.send(rP);
            } else {
                throw new ResourceNotFoundError(`permissions`);
            }
        } catch (err) {
            res.status(err.httpStatusCode).send({message: err.message})
        }
    }).catch( err => {
        res.status(401).send({message: err.message})
    })
})

// Create/Update role
adminRouter.post('/saveRole', tokenGuard(), (req, res) => {
    let reqUser: UserResponse = res.locals.user;
    let saveRole: Role = req.body.role;
    adminService.getRoleById(saveRole.roleId)
        .then( r => {
            try {
                // Update existing found role 
                if (r && reqUser.hasPermission(PermissionType.ROLES_UPDATE, r.customerId, r.venueId)) {
                    adminService.updateRole(r, saveRole)
                        .then( (updateRole:Role) => {
                            res.send(updateRole.toResponse());
                        }).catch( err => {
                            res.send(err)
                        })
                // Create new role (no venue level users)
                } else if (!r && reqUser.hasPermission(PermissionType.ROLES_CREATE, saveRole.customerId, saveRole.venueId)) {
                    adminService.createRole(saveRole)
                        .then( (newRole: Role) => {
                            let savedRole = newRole.toResponse();
                            res.send(savedRole);
                        // Could not save role
                        }).catch( err => {
                            res.status(401).send({message: err.message});
                        })
                // Wut?
                } else res.status(401).send();
            } catch (err) {
                res.status(err.httpStatusCode).send({message: err.message})
            }
        }).catch( err => {
            res.status(401).send({message: err.message})
        })
    })


