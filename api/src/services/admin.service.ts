import { User, UserResponse, UserRole } from '../models/Player';
import { EmailAlreadyInUseError, InternalError, ResourceNotFoundError, ATCError } from '../models/Error';
import { Customer, CustomerResponse } from '../models/Customer';
import { Venue, VenueResponse } from '../models/Venue';
import { Role, RolePermissions } from '../models/Role';
import * as s from 'sequelize';
import { Permission } from '../models/Permission';

export class AdminService {

    /**
     * Get all users assigned to a customer
     * @param _customerId 
     */
    getUsersByCustomer(_customerId) {
        return User.findAll({ 
            where: {
                [s.Op.and]: {
                    customerId: _customerId,
                    deleted: false 
                }
            }
        });
    }

    /**
     * Get all users assigned to a venue
     * @param _venueId 
     */
    getUsersByVenue(_venueId) {
        return User.findAll({ 
            where: {
                [s.Op.and]: {
                    defaultVenueId: _venueId,
                    deleted: false 
                }
            }
        });
    }

    /**
     * Get a single user by ID
     * @param _userId 
     */
    getUserById(_userId) {
        return User.findById(_userId);
    }

    /**
     * Get a single user by email
     * @param _email 
     */
    getUserByEmail(_email: string) {
        return User.findAll( {where: {email:_email} } );
    }

    /**
     * Get all of the users the requesting entity is permitted to
     * view 
     * @param user 
     */
    getAllAccessibleUsers(user: UserResponse) {
        let scope = user.role[0];
        if (scope.isSuperAdmin) {
            return User.findAll({
                where: {
                    deleted: false 
                }
            })
        } else if (scope.isCustomerAdmin) {
            let customerId = scope.customer.customerId;
            return User.findAll({
                where: {
                    [s.Op.and]: {
                        deleted: false,
                        customerId: customerId 
                    }
                    
                }
            });
        } else if (scope.isVenueAdmin) {
            let venueId = scope.venue.venueId;
            return User.findAll( {
                where: {
                    [s.Op.and]: {
                        deleted: false,
                        venueId: venueId 
                    }
                    
                }
            });
        }
    }

    /**
     * Add a user to the database
     * @see User 
     * @see Customer
     * @see Role
     * @see Permission
     * @see Venue
     * @param user 
     */
    createUser(user) {
        return new Promise ( (resolve, reject) => {
            let u = new User();
            this.getUserByEmail(user.email)
                .then(existingUser => {
                    if (existingUser.length != 0) {
                        return reject(new EmailAlreadyInUseError(existingUser[0].email) );
                    }
                    // Check that the role is available
                    Role.findById(user.role[0].roleId)
                        .then( role => {
                            user.role[0] = role;
                            this.assignUserValues(u, user);
                            u.save().then( u => {
                                // Delete any user_role rows that have the user's id (we only want one role/user)
                                // Save the user then save the user's role, if successful
                                if (u && u.role && u.role[0].roleId) {
                                    UserRole.destroy({
                                        where: { userId: u.userId }
                                            }).then( deleted => {
                                                let ur = new UserRole();
                                                ur.userId = u.userId;
                                                ur.roleId = u.role[0].roleId;
                                                ur.save()
                                                    .then( res => {
                                                        resolve(u) 
                                                    })
                                                    .catch( err => {
                                                        console.log(err);
                                                        return reject(new InternalError(err) ) 
                                                    })
                                                })
                                            
                                } else {
                                    UserRole.destroy({
                                        where: { userId: u.userId }
                                    }).then( res => resolve(u))
                                } 
                            })
                    })
                        
                })
            })
        }
    
    /**
     * Update a previously stored user in the database
     * @param prevUser 
     * @param updatedUser 
     */
    updateUser(prevUser: User, updatedUser: User | UserResponse): any {
        return new Promise ((resolve, reject) => {
        // Need to adjust user_roles table if they're changing role
        let updateRole = false;
        Role.findById(updatedUser.role[0].roleId).then(
            usrRole => {
                updatedUser.role[0] = usrRole;
                if (prevUser.role[0].roleId != updatedUser.role[0].roleId) {
                // If new role is being assigned, update the user's role in user table
                UserRole.update(
                    { roleId: updatedUser.role[0].roleId },
                    { where: { userId: prevUser.userId } })
                    .then( 
                        updatedRole => {
                            this.assignUserValues(prevUser, updatedUser);
                            prevUser.save().then(
                                // save() strips off joined roles/ven/cust so return original object on success
                                u => resolve(prevUser)
                            );
                    }).catch(
                        err => {
                            reject(new InternalError(err));
                    })
            } else {
                this.assignUserValues(prevUser, updatedUser);
                return prevUser.save().then(
                    u => {
                        resolve(prevUser)
                }
            )}
        }).catch(
            err=> { 
                reject(new ResourceNotFoundError('role'));
            })
        })
    }

    private assignUserValues(prevUser, updatedUser) {
        prevUser.userId = updatedUser.userId;
        prevUser.email = updatedUser.email;
        prevUser.dateCreated = updatedUser.dateCreated;
        prevUser.title = updatedUser.title;
        prevUser.emailConfirmed = updatedUser.emailConfirmed;
        prevUser.defaultVenueId = updatedUser.defaultVenueId;
        prevUser.customerId = updatedUser.customerId;
        prevUser.phoneNumber = updatedUser.phoneNumber;
        prevUser.phoneNumberConfirmed = updatedUser.phoneNumberConfirmed;
        prevUser.twoFactorEnabled = updatedUser.twoFactorEnabled;
        prevUser.lockOutEnabled = updatedUser.lockOutEnabled;
        prevUser.active = updatedUser.active;
        prevUser.deleted = updatedUser.deleted;
        prevUser.alertNewFeedback = updatedUser.alertNewFeedback;
        prevUser.name = updatedUser.name;
        prevUser.role = updatedUser.role;
    }

    /**
     * Get a single customer by ID
     * @param customerId 
     */
    getCustomerById(customerId) {
        return Customer.findById(customerId);
    }

    /**
     * Get all customers stored in database
     */
    getAllCustomers() {
        return Customer.findAll();
    }

    /**
     * Up date a previously stored customer in the database
     * @param prevCust 
     * @param updatedCust 
     */
    updateCustomer(prevCust: Customer, updatedCust: Customer | CustomerResponse) {
        this.assignCustomerValues(prevCust, updatedCust);
        return prevCust.save();
    }

    /**
     * Create a new customer
     * @see Venue
     * @see Customer
     * @param customer 
     */
    createCustomer(customer) {
        let c = new Customer(customer);
        this.assignCustomerValues(customer, c);
        return c.save();
        
    }

    private assignCustomerValues(prevCust, updatedCust) {
        prevCust.name = updatedCust.name;
        prevCust.displayName = updatedCust.displayName;
        prevCust.address1 = updatedCust.address1;
        prevCust.address2 = updatedCust.address2;
        prevCust.city = updatedCust.city;
        prevCust.state = updatedCust.state;
        prevCust.zip = updatedCust.zip;
        prevCust.country = updatedCust.country;
        prevCust.changePasswordTimeout = updatedCust.changePasswordTimeout;
        prevCust.logo = updatedCust.logo || updatedCust._logo;
  
    }

    /**
     * Get a single venue by ID
     * @param venueId 
     */
    getVenueById(venueId) {
        return Venue.findById(venueId);
    }

    /**
     * Get an array of venues
     * @param Array<venueId>
     */
    getVenuesById(venueIds: Array<string>) {
        let where = [];
        for (let id of venueIds) {
            where.push({venueId: id})
        }
        return Venue.findAll(
            { where: {
               [s.Op.or]: where }
            }
        )
    }

    /**
     * Get all venues that belong to a single customer
     * @param customerId 
     */
    getVenuesByCustomer(customerId) {
        return Venue.findAll({
            where: {
                venueCustomerId: customerId
            }
        });
    }

    /**
     * Get all venues that belong to a single customer (ATC Venue Id format)
     * @param atcCustomerId 
     */
    getVenueByATCCustomer(atcCustomerId) {
        return Venue.find({
            where: {
                venueATCSiteId: atcCustomerId
            }
        });
    }

    /**
     * Get all venues in the database
     */
    getAllVenues() {
        return Venue.findAll();
    }

    /**
     * Create a venue
     * @see Customer
     * @see Venue
     * @param venue 
     */
    createVenue(venue) {
        let v = new Venue(venue);
        this.assignVenueValues(venue, v);
        return v.save();
        
    }

    /**
     * Update a venue previously stored in the database
     * @param prevVenue 
     * @param updatedVenue 
     */
    updateVenue(prevVenue: Venue, updatedVenue: Venue | VenueResponse) {
        // Need to adjust user_roles table if they're changing role
        this.assignVenueValues(prevVenue, updatedVenue);
        return prevVenue.save();
    }

    private assignVenueValues(prevVenue, updatedVenue) {
        prevVenue.venueCustomerId = updatedVenue.venueCustomerId;
        prevVenue.venueATCSiteId = updatedVenue.venueATCSiteId;
        prevVenue.venueNameRealm = updatedVenue.venueNameRealm;
        prevVenue.venueNameUserDefined = updatedVenue.venueNameUserDefined;
        prevVenue.venueLat = updatedVenue.venueLat;
        prevVenue.venueLon = updatedVenue.venueLon;
        prevVenue.address1 = updatedVenue.address1;
        prevVenue.address2 = updatedVenue.address2;
        prevVenue.city = updatedVenue.city;
        prevVenue.state = updatedVenue.state;
        prevVenue.zip = updatedVenue.zip;
        prevVenue.country = updatedVenue.country;
        prevVenue.type = updatedVenue.type;
        prevVenue.active = updatedVenue.active;
        prevVenue.timezone = updatedVenue.timezone;
    }
        
    /**
     * Get all roles 
     */
    getAllRoles() {
        return Role.findAll();
    }

    /**
     * Get all roles belonging to a customer
     * @param _customerId
     * @see Role
     */
    getRolesByCustomer(_customerId, includeSystemRoles?) {
        let where: Array<any> = [{customerId: _customerId}];
        if (includeSystemRoles) {
            where.push({_isSuperAdmin: 1})
        }
        return Role.findAll({
            where: {
                [s.Op.or]: where 
            }
        });
    }

    /**
     * Get all roles belonging to a venue
     * @param _venueId
     */
    getRolesByVenue(_venueId) {
        return Role.findAll({
            where: {
                venueId: _venueId
            }
        });
    }

    /**
     * Get role by ID
     * @param _roleId
     */
    getRoleById(_roleId) {
        return Role.findOne({
            where: {
                roleId: _roleId
            }
        });
    }

    /**
     * Create a new role
     * @param role
     */
    createRole(_role) {
        return new Promise( (resolve, reject) => {
            let r = new Role(_role);
            r.customerId = _role.customer.customerId;
            r.venueId = _role.venue.venueId;
            r.isSuperAdmin = _role.isSuperAdmin;
            r.isCustomerAdmin = _role.isCustomerAdmin;
            r.isVenueAdmin = _role.isVenueAdmin;
            // Save the role first then use the newly created Id to assign role_perms
            r.save()
            .then( newRole => {
                let newRolePerms = [];
                let newPerms = [];
                for (let perm of _role.permissions) {
                    newRolePerms.push({roleId: newRole.roleId, permissionId: perm.permissionId})
                    newPerms.push(new Permission(perm))
                }
                RolePermissions.bulkCreate(newRolePerms)
                    .then( rps => {
                        r.permissions = newPerms;
                        resolve(r);
                    }).catch( err => {
                        reject(new ATCError(err.message))
                    })
            }).catch( err => {
                reject(new ATCError(err.message))
            })  
        })
             
    }

     /**
     * Update a role
     * @param role
     */
    updateRole(prevRole, updatedRole: Role) {
        return new Promise( (resolve, reject) => {
            // Delete the rows in the role_permission table corresponding with the updated role
            RolePermissions.destroy({
                where: {
                    roleId: prevRole.roleId
                }
            })
            .then(() => {
                // Add the updated permissions to an array
                let newPerms = [];
                for (let perm of updatedRole.permissions) {
                    newPerms.push({roleId: prevRole.roleId, permissionId: perm.permissionId})
                }
                RolePermissions.bulkCreate(newPerms)
                .then( newRPs => {
                    this.assignRoleValues(prevRole, updatedRole);
                    prevRole.save()
                    .then( role => resolve(role))
                    .catch( err => reject(err))
                }).catch( err => {
                    reject(new ATCError(err.message))
                })
            }).catch( err => {
                reject(new ATCError(err.message))
            })
        })
    }

    private assignRoleValues(prevRole: Role, updatedRole: Role) {
        prevRole.roleName = updatedRole.roleName;
        prevRole.isSuperAdmin = updatedRole.isSuperAdmin;
        prevRole.isCustomerAdmin = updatedRole.isCustomerAdmin;
        prevRole.customerId = updatedRole.customer.customerId
        prevRole.isVenueAdmin = updatedRole.isVenueAdmin
        prevRole.venueId = updatedRole.venue.venueId
  
    }

     /**
     * Get all system permissions
     * @see Permissions
     */
    getPermissions() {
        return Permission.findAll();
    }


}