const DashboardHeader = () => {
  return (
    <div className="h-16 flex items-center">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span className="text-black">Hi, wallace.base</span>{" "}
          <span className="text-xl">👋</span>
        </h1>
        <p className="text-gray-600">
          Spend and deposit crypto into your ElementPay wallet instantly
        </p>
      </div>
    </div>
  );
};

export default DashboardHeader;
