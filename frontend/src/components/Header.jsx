import React from 'react';

const Header = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b-2">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
      </div>
      <div className="flex items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="bg-gray-200 text-sm rounded-full py-2 px-4"
          />
        </div>
        <div className="ml-4">
          {/* You can add user profile/notification icons here */}
        </div>
      </div>
    </header>
  );
};

export default Header;
