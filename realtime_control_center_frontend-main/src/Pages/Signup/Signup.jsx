import React, { useCallback, useContext, useState } from 'react';
import "./Signup.css"
import { Link } from "react-router-dom";
import { AppContext } from '../../contexts/AppContext';
// import Loader from '../../components/Loader/Loader';


const Signup = () => {

  const [name , setName] = useState("")
  const [emailAddress, setEmialAddress] = useState("")
  const [password, setPassword] = useState("")
  // const [loading, setLoading] = useState(false)
  const {setLoading, handleShowAlertModal, serverBaseURL} = useContext(AppContext)


  const handleSignup = (e)=>{
    try{
      e.preventDefault()
      if(!name || !emailAddress || !password){
        handleShowAlertModal("please fill all fields")
        return
      }
      signupApiCall()
    }catch(err){
      console.log("error in handleSignup function", err)
    }
  }

  const signupApiCall = async ()=>{
    try{
      setLoading(true)
      let data = {name, emailAddress, password}
      const response = await fetch(`${serverBaseURL}/auth/signup`, {
        method:"POST",
        headers:{
          "Content-type" : "Application/json"
        },
        body:JSON.stringify(data)
      })

      if(response.ok){
        const data = await response.json()
        console.log("signup api:", data)
        handleShowAlertModal(data.message)
      }else{
        const error_data = await response.json() 
        console.log("signup api error response data:", error_data)
        handleShowAlertModal(error_data.message)
      }
    }catch(err){
      console("error in handleSignup", err)
    }finally{
      setLoading(false)
    }
  }

  return (
    <section className="vh-100">
      <div className="container-fluid h-custom" style={{ height: '100%' }}>
        <div className="row d-flex justify-content-center align-items-center h-100">
          <div className="col-md-9 col-lg-6 col-xl-5">
            <img
              src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
              className="img-fluid"
              alt="Sample image"
            />
          </div>
          <div className="col-md-8 col-lg-6 col-xl-4 offset-xl-1">
            <form onSubmit={handleSignup}>
              <div className="d-flex flex-row align-items-center justify-content-center justify-content-lg-start">
                <p className="lead fw-normal mb-0 me-3">Sign up with</p>
                <button type="button" className="btn btn-primary btn-floating mx-1">
                  <i className="fab fa-facebook-f"></i>
                </button>

                <button type="button" className="btn btn-primary btn-floating mx-1">
                  <i className="fab fa-twitter"></i>
                </button>

                <button type="button" className="btn btn-primary btn-floating mx-1">
                  <i className="fab fa-linkedin-in"></i>
                </button>
              </div>

              <div className="divider d-flex align-items-center my-4">
                <p className="text-center fw-bold mx-3 mb-0">Or</p>
              </div>

              {/* Name input */}
              <div className="form-outline mb-4">
                <input
                  type="text"
                  id="form3Example1"
                  className="form-control form-control-lg"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e)=>{setName(e.target.value)}}
                />
                <label className="form-label" htmlFor="form3Example1">
                  Name
                </label>
              </div>

              {/* Email input */}
              <div className="form-outline mb-4">
                <input
                  type="email"
                  id="form3Example3"
                  className="form-control form-control-lg"
                  placeholder="Enter a valid email address"
                  value={emailAddress}
                  onChange={(e)=>{setEmialAddress(e.target.value)}}
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

              {/* <div className="d-flex justify-content-between align-items-center">
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
              </div> */}

              <div className="text-center text-lg-start mt-4 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                >
                  Signup
                </button>
                <p className="small fw-bold mt-2 pt-1 mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className='link-danger' >
                    Login
                  </Link>
                  {/* <a href="#!" className="link-danger">
                    Login
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

export default Signup;
