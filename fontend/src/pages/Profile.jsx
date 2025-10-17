import React from "react";
import { FaGithub, FaFilePdf, FaLink } from "react-icons/fa";

const Profile = () => {
  const userInfo = {
    name: "Nguyễn Văn Đức",
    studentId: "B22DCCN236",
    group: "16",
    email: "DucNV.B22DCCN25@stu.pti.edu.vn",
    school: "Học viện Công Nghệ Bưu Chính Viễn Thông",
    avatar:
      "https://raw.githubusercontent.com/uyi83/images/main/z6949886921719_246037b0b59adf82e6429da65731a7a7.jpg", // thay bằng ảnh thật của bạn
    github: "https://github.com/uyi83/iot", // 🔗 Thay link GitHub thật
    reportPdf: "https://example.com/baocao.pdf", // 🔗 Link file PDF
    postman: "https://www.postman.com/ducnv/workspace/api-demo", // 🔗 Link Postman workspace
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col items-center">
      {/* Tiêu đề */}
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Thông tin cá nhân
      </h1>

      {/* Thẻ hồ sơ */}
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md flex flex-col items-center">
        {/* Ảnh đại diện */}
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-cyan-500 shadow mb-4">
          <img
            src={userInfo.avatar}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Tên và trường */}
        <h2 className="text-xl font-bold text-gray-800 text-center">
          {userInfo.name}
        </h2>
        <p className="text-cyan-600 font-medium text-sm text-center mb-6">
          {userInfo.school}
        </p>

        {/* Thông tin cá nhân */}
        <div className="w-full space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <span>🎓</span>
            </div>
            <div>
              <p className="text-gray-500">Mã sinh viên</p>
              <p className="font-semibold text-gray-800">
                {userInfo.studentId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span>👥</span>
            </div>
            <div>
              <p className="text-gray-500">Nhóm</p>
              <p className="font-semibold text-gray-800">
                Nhóm {userInfo.group}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span>📧</span>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-semibold text-gray-800">{userInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Liên kết cá nhân */}
        <div className="w-full border-t pt-4 mt-5">
          <h3 className="text-base font-semibold text-gray-700 mb-3 text-center">
            Liên kết cá nhân
          </h3>
          <div className="flex justify-center gap-5">
            <a
              href={userInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition"
              title="GitHub"
            >
              <FaGithub size={18} />
            </a>

            <a
              href={userInfo.reportPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
              title="Báo cáo PDF"
            >
              <FaFilePdf size={18} />
            </a>

            <a
              href={userInfo.postman}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition"
              title="Postman API"
            >
              <FaLink size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
