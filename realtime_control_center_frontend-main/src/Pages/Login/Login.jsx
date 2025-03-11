import React, { useContext, useState } from "react";
import "./Login.css";
import { json, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../contexts/AppContext";
// import Loader from "../../components/Loader/Loader";



const Login = () => {
  const navigate = useNavigate()
  const [emailAddress,  setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  // const [loading, setLoading] = useState(false)
  const {setLoading, handleShowAlertModal, serverBaseURL} = useContext(AppContext)

  const handleSubmit = (e)=>{
    try{
      e.preventDefault()
      console.log("handle submit called")

      if(emailAddress.trim() === ""  || password.trim() === "" ){
        handleShowAlertModal("Please fill all fields")
        return false
      }

      console.log("before api call")
      handleLoginApiCall()

    }catch(err){
      console.log("error inside the handleSubmit func", err)
    }
  }

  const handleLoginApiCall = async() =>{
    try{
      setLoading(true)
      const data = {emailAddress, password}
      // console.log("data noraml", data)
      // console.log("JSON.stringify(data)",JSON.stringify(data))
      const response = await fetch(`${serverBaseURL}/auth/login`, {
        method:"POST", 
        headers:{
          "Content-type":"application/json"
        },
        body:JSON.stringify(data)
      }) 
      if (response.ok) {
        const response_data = await response.json();
        // console.log("response_data.user", response_data.user)
        localStorage.setItem('user', JSON.stringify(response_data.user));
        navigate('/dashboard/sources');
      } else {
        // If the response is not ok, log the error
        const error_data = await response.json();
        handleShowAlertModal(error_data.message)
        console.log("login api response:", error_data);
      }
    }catch(err){
      handleShowAlertModal("Server is down, Please try again later")
      console.log("error in handleLoginApiCall func", err)
    }finally{
      setLoading(false)
    }
  }
  
  return (
    <section className="vh-100">
      <div className="container-fluid h-custom" style={{ height: "100%" }}>
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-md-9 col-lg-6 col-xl-5">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              className="img-fluid"
              alt="Sample image"
            />
          </div>
          <div className="col-md-8 col-lg-6 col-xl-4 offset-xl-1">
            <form onSubmit={handleSubmit}>
              {/* sigin in with components  */}
              <div className="d-flex flex-row align-items-center justify-content-center justify-content-lg-start">
                <p className="lead fw-normal mb-0 me-3">Sign in with</p>
                <button
                  type="button"
                  className="btn btn-primary btn-floating mx-1"
                >
                  <i className="fab fa-facebook-f"></i>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-floating mx-1"
                >
                  <i className="fab fa-twitter"></i>
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-floating mx-1"
                >
                  <i className="fab fa-linkedin-in"></i>
                </button>
              </div>
               {/* or line and div */}
              <div className="divider d-flex align-items-center my-4">
                <p className="text-center fw-bold mx-3 mb-0">Or</p>
              </div>

              {/* Email input */}
              <div className="form-outline mb-4">
                <input
                  type="email"
                  id="form3Example3"
                  className="form-control form-control-lg"
                  placeholder="Enter a valid email address"
                  value={emailAddress}
                  onChange={(e)=>{setEmailAddress(e.target.value)}}
                />
                <label className="form-label" htmlFor="form3Example3">
                  Email address
                </label>
              </div>

              {/* Password input */}
              <div className="form-outline mb-3">
                <input
                  type="password"
                  id="form3Example4"
                  className="form-control form-control-lg"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e)=>{setPassword(e.target.value)}}
                />
                <label className="form-label" htmlFor="form3Example4">
                  Password
                </label>
              </div>
              {/* Remember me and forgot password */}
              <div className="d-flex justify-content-between align-items-center">
                {/* Checkbox */}
                <div className="form-check mb-0">
                  <input
                    className="form-check-input me-2"
                    type="checkbox"
                    value=""
                    id="form2Example3"
                  />
                  <label className="form-check-label" htmlFor="form2Example3">
                    Remember me
                  </label>
                </div>
                <a href="#!" className="text-body">
                  Forgot password?
                </a>
              </div>

              {/* login button and dont have account registed div */}
              <div className="text-center text-lg-start mt-4 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg custom-login-btn"
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                >
                  Login
                </button>
                <p className="small fw-bold mt-2 pt-1 mb-0">
                  Don't have an account?{" "}
                  <Link to="/signup" className="link-danger">
                    Register
                  </Link>
                  {/* <a href="#!" className="link-danger">
                    Register
                  </a> */}
                </p>

              </div>
              
            </form>
          </div>
        </div>
      </div>
      {/* <Loader loading={loading}></Loader> */}
    </section>
  );
};

export default Login;
