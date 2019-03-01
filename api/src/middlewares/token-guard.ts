// import { IncomingHttpHeaders } from 'http';
// import { RequestHandler } from 'express';
// import { UserService } from '../services/user.service';
// import { PermissionType } from '../models/Permission';
// import { UserResponse } from '../models/Player';  
// import { InvalidTokenError } from '../models/Error';
// import { Token } from '../models/Token';

// const userService = new UserService()

// function getToken(headers: IncomingHttpHeaders) {
//   return headers.accesstoken;
// }

// export const tokenGuard: (() => 
//   RequestHandler) = () => (req, res, next) => {
  
//   let token: any = getToken(req.headers || req.body || '');
//   if (!token) {
//     res.status(403).send({message: `Missing access token`});
//     return;
//   }
//   userService.getUserProfile(token)
//     .then( (userAndToken) => {
//       try {
//         if (userAndToken) {
//           // Add the user object to the response - we can check permissions and drive UI with this
//           res.locals.user = userAndToken.user;
//           next();
//         } else throw new InvalidTokenError(token);
//       } catch(err) {
//         res.status(err.httpStatusCode).send({message: err.message});
//       }
//       }).catch(err => {
//         res.status(err.httpStatusCode).send({message: err.message});
//       })
//     }
   

