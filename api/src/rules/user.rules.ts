import { check } from 'express-validator/check'
import { User } from '../models/Player'

export const userRules = {
  forRegister: [
    check('email')
      .isEmail().withMessage('Invalid email format')
      .custom(email => User.findOne({ where: { email } }).then(u => !!!u)).withMessage('Email is already in use'),
    check('password')
      .isLength({ min: 8 }).withMessage('Invalid password'),
    check('confirmPassword')
      .custom((confirmPassword, { req }) => req.body.password === confirmPassword).withMessage('Passwords are different')
  ],
  forLogin: [
    check('email')
      .isEmail().withMessage('Invalid email format'),
    check('password')
      .exists().withMessage('Invalid email or password')
      // password rule not enforced for legacy site
      .isLength({ min: 1 }).withMessage('Invalid email or password'),
  ],
  forLogout: [
    check('accessToken').exists().withMessage('Missing access token')
  ],
  forGetUserInfo: [
    check('accessToken').exists().withMessage('Missing access token')
  ]
}