/**
 * User Model Module
 *
 * SQLAlchemy-equivalent User model using Sequelize.
 * Must match Python backend's User table structure exactly.
 *
 * Database Table: users
 * Fields match Python: id, email, full_name, hashed_password, is_active, is_admin, language
 */

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../core/database";

/**
 * User attributes interface
 */
interface UserAttributes {
  id: number;
  email: string;
  full_name: string;
  hashed_password: string;
  is_active: boolean;
  is_admin: boolean;
  language: string;
}

/**
 * Optional attributes for creation (id is auto-generated)
 */
interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "id" | "is_active" | "is_admin" | "language"
  > {}

/**
 * User model class
 */
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public email!: string;
  public full_name!: string;
  public hashed_password!: string;
  public is_active!: boolean;
  public is_admin!: boolean;
  public language!: string;
}

/**
 * Initialize User model with Sequelize
 */
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hashed_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: "it",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: false,
  }
);
