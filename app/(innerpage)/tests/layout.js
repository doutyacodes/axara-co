import Navbar from "./_components/Navbar/page";

const Layout = ({ children }) => {
  return (
    <div>
      {/* <Navbar /> */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;