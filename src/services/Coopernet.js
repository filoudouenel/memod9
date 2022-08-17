class Coopernet {
    constructor() {
        //this.url_server = "https://coopernet.fr/";
        this.url_server = (process.env.NODE_ENV == 'development') ? 'http://local.coopernet.my/' : 'https://coopernet.fr/';
        this.token = "";
        this.user = {
            id: 0,
            name: "",
            pwd: ""
        };
    }
    /**
     * Appel d'un endpoint de suppression de carte sur le serveur
     * @param {Number} card_id 
     * @returns Promise
     */
    removeCard = (card_id) => {
        console.log(`dans removeCard - card_id ${card_id}`);
        // utilisation de fetch
        return fetch(this.url_server + "node/" + card_id + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "DELETE",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                Authorization: "Basic " + btoa(this.user.name + ":" + this.user.pwd) // btoa = encodage en base 64
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },

                type: [
                    {
                        target_id: "card"
                    }
                ]
            })
        })
            .then(response => response)
            .then(data => {
                if (data.status === 204) {
                    console.log(`OK status 204 de removeCard`);
                    return data;
                } else {
                    throw new Error("Le status du serveur n'est pas 204", data.status);
                }
            });
    };
    /**
     * Appel d'un endpoint de suppression de Term sur le serveur
     * 
     * @param {Number} tid 
     * @returns Promise
     */
    removeTerm = (tid) => {
        console.log("dans removeTerm - term ", tid);
        // utilisation de fetch
        return fetch(this.url_server + "taxonomy/term/" + tid + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "DELETE",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                Authorization: "Basic " + btoa(this.user.name + ":" + this.user.pwd) // btoa = encodage en base 64
            }
        })
            .then(response => response)
            .then(data => {
                console.log("data reçues dans removeTerm:", data);
                if (data.status === 204) {
                    return data;
                } else {
                    throw new Error("Le status du serveur n'est pas 204", data.status);
                }
            });
    };
    /**
     * Méthode qui permet à une card de changer de column
     */
    createReqEditColumnCard = (
        num_card,
        login,
        pwd,
        new_col_id,
        themeid,
        callbackSuccess,
        callbackFailed
    ) => {
        console.log("Dans createReqEditColumnCard de coopernet");
        console.log("token : ", this.token);
        // création de la requête
        // utilisation de fetch

        fetch(this.url_server + "node/" + num_card + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "PATCH",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                "Authorization": "Basic " + btoa(login + ":" + pwd) // btoa = encodage en base 64
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },
                field_card_column: [
                    {
                        target_id: new_col_id,
                        url: "/taxonomy/term/" + new_col_id
                    }
                ],

                type: [
                    {
                        target_id: "card"
                    }
                ]
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("data reçues dans createReqEditColumnCard :", data);
                if (data) {
                    callbackSuccess(themeid);
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de data ", data);
                }
            })
            .catch(error => { console.error("Erreur attrapée dans createReqEditColumnCard", error); });
    };
    createReqEditCard = (
        card,
        themeid,
        columnid,
        callbackSuccess,
        callbackFailed,
        no_reload
    ) => {
        console.log("Dans createReqEditCard de coopernet");
        // création de la requête avec fetch
        fetch(this.url_server + "node/" + card.id + "?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "PATCH",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                Authorization: "Basic " + btoa(this.user.name + ":" + this.user.pwd) // btoa = encodage en base 64
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },
                title: [
                    {
                        value: card.question
                    }
                ],
                field_card_question: [
                    {
                        value: card.question
                    }
                ],
                field_card_answer: [
                    {
                        value: card.answer
                    }
                ],
                field_card_explanation: [
                    {
                        value: card.explanation
                    }
                ],
                field_card_column: [
                    {
                        target_id: columnid,
                        url: "/taxonomy/term/" + columnid
                    }
                ],
                field_card_theme: [
                    {
                        target_id: themeid,
                        url: "/taxonomy/term/" + themeid
                    }
                ],
                type: [
                    {
                        target_id: "card"
                    }
                ]
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("data reçues :", data);
                if (data) {
                    callbackSuccess(themeid, no_reload);
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de donnée", data);
                }
            })
            .catch(error => {
                console.error("Erreur attrapée dans createReqEditCard :", error);
            });
    };
    createReqAddCards = (
        card,
        themeid,
        callbackSuccess,
        callbackFailed
    ) => {
        console.log("Dans createReqAddCards de coopernet");
        // création de la requête
        // utilisation de fetch
        fetch(this.url_server + "node?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "POST",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                Authorization: "Basic " + btoa(this.user.name + ":" + this.user.pwd) // btoa = encodage en base 64
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "rest/type/node/carte"
                    }
                },
                title: [
                    {
                        value: card.question
                    }
                ],
                field_card_question: [
                    {
                        value: card.question
                    }
                ],
                field_card_answer: [
                    {
                        value: card.answer
                    }
                ],
                field_card_explanation: [
                    {
                        value: card.explanation
                    }
                ],
                field_card_column: [
                    {
                        target_id: card.column,
                        url: "/taxonomy/term/" + card.colonnne
                    }
                ],
                field_card_theme: [
                    {
                        target_id: themeid,
                        url: "/taxonomy/term/" + themeid
                    }
                ],
                type: [
                    {
                        target_id: "carte"
                    }
                ]
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("!!!!!!!!!!!!!!!!!!!data reçues dans createReqAddCards: ", data);
                if (data.hasOwnProperty("created") && data.created[0].value) {
                    callbackSuccess(themeid, card.id);
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de donnée : ", data);
                }
            })
            .catch(error => { console.error("Erreur catchée dans createReqAddCard : ", error); });
    };
    createReqAddOrEditTerm = (
        login,
        pwd,
        label,
        tid,
        callbackSuccess,
        callbackFailed,
        ptid = 0
    ) => {
        console.log("Dans createReqAddOrEditTerm de coopernet, envoie du label : ", label);
        //console.log("ptid : ", ptid);
        // création de la requête
        // utilisation de fetch
        fetch(this.url_server + "memo/term?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "POST",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                Authorization: "Basic " + btoa(login + ":" + pwd) // btoa = encodage en base 64
            },
            body: JSON.stringify({
                _links: {
                    type: {
                        href: this.url_server + "memo/term"
                    }
                },
                label: [
                    {
                        value: label
                    }
                ],
                tid: [
                    {
                        value: tid
                    }
                ],
                ptid: [
                    {
                        value: ptid
                    }
                ]
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("data reçues : ", data);
                if (data.hasOwnProperty("newtid")) {
                    callbackSuccess(data.newtid, "added");
                } else if (data.hasOwnProperty("updatedtid")) {
                    callbackSuccess(data.updatedtid, "updated");
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de donnée", data);
                }
            })
            .catch(error => {
                console.error("Erreur attrapée dans createReqAddOrEditTerm", error);
            });
    };


    /*
     * Récupère les données structurées sous forme de json imbriqué
     * @param {Number} term_id 
     * @returns Promise
     */
    getCards = (term_id) => {
        return fetch(
            this.url_server +
            "memo/list_cards_term/" +
            this.user.id +
            "/" +
            term_id,
            {
                credentials: "same-origin",
                method: "GET",
                headers: {
                    "Content-Type": "application/hal+json",
                    "X-CSRF-Token": this.token,
                    Authorization: "Basic " + btoa(this.user.name + ":" + this.user.pwd), // btoa = encodage en base 64
                },
            }
        )
            .then((response) => {
                if (response.status === 200) return response.json();
                else throw new Error("Problème de réponse du serveur :  " + response.status);
            })
            .then((data) => {
                console.log("Data dans getCards : ", data);
                return data;
            });

    };
    getUsers = (callbackSuccess, callbackFailed) => {
        // création de la requête
        console.log("Dans getUsers de coopernet.");
        return fetch(this.url_server + "memo/users/", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                "Authorization": "Basic " + btoa(this.user.name + ":" + this.user.pwd) // btoa = encodage en base 64
            }
        })
            .then(response => {
                console.log("data reçues dans getUsers avant json() :", response);
                if (response.status === 200) return response.json();
                else throw new Error("Problème de réponse ", response);
            })
            .then(data => {
                console.log("data reçues dans getTerms :", data);
                if (data) {
                    // ajout de la propriété "open" à "false" pour tous les termes de
                    // niveau 1
                    //data.forEach()
                    return data;
                } else {
                    throw new Error("Problème de data ", data);
                }
            })
            .catch(error => { console.error("Erreur attrapée dans getUsers", error); });
    };
    logUser = (login, pwd) => {
        console.log(`Dans logUser ;`, login, pwd, this.token);
        return fetch(this.url_server + "user/login?_format=json", {
            credentials: "same-origin",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": this.token
            },
            body: JSON.stringify({
                name: login,
                pass: pwd
            })
        })
            .then(response => response.json())
            .then(data => {
                //console.log("success", data);
                if (data.current_user === undefined) {
                    console.log("Erreur de login");
                    throw new Error("Erreur de data : ", data);
                } else {
                    this.user.id = data.current_user.uid;
                    this.user.name = data.current_user.name;
                    this.user.pwd = pwd;
                }
            })
    }
    /**
     * @param  {} callbackSuccess
     * @param  {} callbackFailed
     */
    getTerms = (callbackSuccess, callbackFailed, user = this.user) => {
        // création de la requête
        console.log("Dans getTerms de coopernet. User = ", user);
        fetch(this.url_server + "memo/themes/" +
            user.id, {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token,
                "Authorization": "Basic " + btoa(this.user.name + ":" + this.user.pwd) // btoa = encodage en base 64
            }
        })
            .then(response => {
                console.log("data reçues dans getTerms avant json() :", response);
                if (response.status === 200) return response.json();
                else throw new Error("Problème de réponse ", response);
            })
            .then(data => {
                console.log("data reçues dans getTerms :", data);
                if (data) {
                    // ajout de la propriété "open" à "false" pour tous les termes de
                    // niveau 1
                    //data.forEach()
                    callbackSuccess(data, user);
                } else {
                    callbackFailed("Erreur de login ou de mot de passe");
                    throw new Error("Problème de data ", data);
                }
            })
            .catch(error => { console.error("Erreur attrapée dans getTerms", error); });
    };


    createReqLogout = () => {
        console.log("Dans createReqLogout de coopernet");
        fetch(this.url_server + "user/logout?_format=hal_json", {
            // permet d'accepter les cookies ?
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/hal+json",
                "X-CSRF-Token": this.token
            }
        })
            .then(response => response)
            .then(data => {
                console.log("data reçues :", data);
                if (data) {
                    //callbackSuccess(themeid);
                } else {
                    //callbackFailed("Erreur de login ou de mot de passe");
                }
            })
            .catch(error => { console.error("Erreur attrapée dans createReqLogout", error) });
    };
    getToken = () => {
        console.log(`Dans getToken`);
        return fetch(`${this.url_server}/session/token/`)
            .then((response) => {
                if (response.status !== 200) { // si ça c'est mal passé
                    throw new Error("Le serveur n'a pas répondu correctement");
                } else return response.text(); // renvoie une promesse
            })
            .then((token) => {
                this.token = token;
                return token;
            });
    }

    isLoggedIn = () => {
        console.log("Dans isLoggedIn de Coopernet");

        return fetch(`${this.url_server}/memo/is_logged`)
            .then(function (response) {
                if (response.status !== 200) { // si ça c'est mal passé
                    throw new Error("Le serveur n'a pas répondu correctement");
                } else return response.json(); // renvoie une promesse
            })
            .then(function (user) {
                //this.token = token;
                return user;
            });
    };



    postLogin = req => {
        console.log("dans postLogin de coopernet");
        // On teste directement le status de notre instance de XMLHttpRequest
        if (req.status === 200) {
            // Tout baigne, voici le contenu de la réponse
            console.log("login response : ", req.responseText);
        } else {
            // On y est pas encore, voici le statut actuel
            console.log("Pb login - Statut : ", req.status, req.statusText);
            return "";
        }
    };


    getIsLogged = (req, callbackSuccess, callbackFailed) => {
        console.log('Dans getIsLogged de coopernet');
        // On teste directement le status de notre instance de XMLHttpRequest
        //console.log("dans getIsLogged de Coopernet");
        if (req.status === 200) {
            // Tout baigne, voici le contenu de la réponse
            console.log("Appel à /memo/is_logged ok");
            // Construction de l'objet js à partir des données récupérées avec
            // la fonction JSON.parse
            let jsonResponse = JSON.parse(req.responseText);
            if (jsonResponse.user === 0) {
                console.log("anonymous user");
                //console.log("User", jsonResponse.user);
                callbackFailed();
            } else {
                //console.log("User", jsonResponse.user);
                callbackSuccess();
            }
            //login(this.responseText);
        } else if (req.status === 403) {
            console.log("Statut 403", req.status, req.statusText);
            this.createReqLogout();
        } else {
            // On y est pas encore, voici le statut actuel
            console.log("Statut d'erreur : ", req.status, req.statusText);
            callbackFailed();
        }
    };

    getTasks = () => {
        console.log(`dans getTasks`);
        return fetch(
            this.url_server + "tasks/list_tasks/",
            {
                credentials: "same-origin",
                method: "GET",
                headers: {
                    "Content-Type": "application/hal+json",
                    "X-CSRF-Token": this.token,
                    Authorization: "Basic " + btoa(this.name + ":" + this.pwd), // btoa = encodage en base 64
                },
            }
        )
            .then((response) => {
                console.log("data reçues dans getTasks avant json() :", response);
                if (response.status === 200) return response.json();
                else throw new Error("Problème de réponse ", response);
            })
            .then((data) => {
                console.log("Data dans getTasks : ", data);

            })
            .catch((error) => {
                console.log("Erreur attrapée dans getTasks", error);

            });
    };
}
export default Coopernet;
