const IotDataInfo = require("../models/iot_data.model");

async function createIotData(iotData) {
  const newIotData = new IotDataInfo({
    ...iotData,
  });
  return newIotData.save();
}

const updateIotData = async (id, updatedData) => {
  // Tìm người dùng theo username
  const iotData = await IotDataInfo.findOne({ where: { id } });

  // Kiểm tra nếu người dùng tồn tại
  if (!iotData) {
    throw new Error("IotData not found");
  }

  // Cập nhật thông tin người dùng
  Object.assign(iotData, updatedData);
  await iotData.save(); // Lưu cập nhật vào cơ sở dữ liệu

  return iotData;
};

async function getIotDataById(id) {
  try {
    // Truy vấn cơ sở dữ liệu để tìm bản ghi có id tương ứng
    const iotData = await IotDataInfo.findOne({
      where: { id: id },
    });

    // Nếu không tìm thấy, trả về thông báo hoặc null
    if (!iotData) {
      return `Không tìm thấy bàn với số bàn: ${id}`;
    }

    // Trả về đối tượng iotData (IotDataInfo)
    return iotData;
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error("Lỗi khi truy vấn:", error);
    throw error; // Ném lỗi ra ngoài
  }
}

module.exports = {
  createIotData,
  updateIotData,
  getIotDataById,
};
