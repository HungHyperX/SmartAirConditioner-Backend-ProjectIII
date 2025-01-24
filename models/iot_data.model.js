const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.config"); // Import kết nối cơ sở dữ liệu

const IotData = sequelize.define(
  "IotData",
  {
    temperature: {
      type: DataTypes.FLOAT, // Kiểu dữ liệu số thực
      allowNull: false, // Không cho phép null
    },
    humidity: {
      type: DataTypes.FLOAT, // Kiểu dữ liệu số thực
      allowNull: false, // Không cho phép null
    },
    timestamp: {
      type: DataTypes.DATE, // Kiểu dữ liệu ngày giờ
      allowNull: false, // Không cho phép null
      validate: {
        isDate: true, // Kiểm tra timestamp phải là ngày hợp lệ
      },
    },
  },
  {
    tableName: "iot_data", // Tên bảng trong cơ sở dữ liệu
    timestamps: false, // Không tự động thêm các cột createdAt và updatedAt
  }
);

module.exports = IotData;
