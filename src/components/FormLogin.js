const FormLogin = (props) => {
    return (
        <form id="login-form" onSubmit={(e)=> {props.handleSubmitFormLogin(e)}} method="POST">
          <label className="me-4 label-login-form">
            <div>login :</div>
            <input
              id="edit-name"
              name="name"
              type="text"
              className="validate form-control"
            />
          </label>
          <label className="me-4 label-login-form">
            <div>mot de passe :</div>
            <input
              id="edit-pass"
              name="pass"
              type="password"
              className="validate me-5 form-control"
            />
          </label>
          <button type="submit" className="btn btn-default btn-info p-2 mt-3">
            Sign in
          </button>
        </form>
    );
}

export default FormLogin;