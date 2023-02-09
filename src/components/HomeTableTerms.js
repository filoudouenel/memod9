import React, {useEffect, useReducer, useState} from 'react';
import Coopernet from "../services/Coopernet";

export const ACTIONS = {
    CALL_API: 'call-api', SUCCESS: 'success', ORDER: 'order'
};
const taskReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.CALL_API: {
            return {
                ...state, loading: true
            };
        }
        case ACTIONS.SUCCESS: {
            return {
                ...state,
                loading: false,
                termsAndCols: action.data.sort((firstTerm, secondTerm) => secondTerm.cols[17] - firstTerm.cols[17])
            };
        }
        case ACTIONS.ORDER: {
            return {
                ...state, termsAndCols: action.data
            };
        }
        default:
            return state;
    }
};
const initialState = {
    termsAndCols: [], loading: false,
};

function HomeTableTerms(props) {

    const [state, dispatch] = useReducer(taskReducer, initialState);
    const {termsAndCols, loading} = state;
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    useEffect(() => {
        dispatch({type: ACTIONS.CALL_API});
        const getTermsAndCols = async () => {
            let response = Object.hasOwn(props, 'user_id') ? await Coopernet.toArrayTermsAndCol(props.user_id) : await Coopernet.toArrayTermsAndCol();
            console.info(response)
            if (response) {
                dispatch({type: ACTIONS.SUCCESS, data: response});
            }
        };
        getTermsAndCols();
        if (window.screen.width < 1000){
            setIsSmallScreen(true);
        }
    }, [props]);

    const transformText = string => {
        return string.replace('&#039;', "'").replace('&#34;', "\"");
    };

    const sortByName = () => {
        dispatch({
            type: ACTIONS.ORDER, data: state.termsAndCols.sort((firstTerm, secondTerm) => {
                const firstTermName = firstTerm.name.toUpperCase();
                const secondTermName = secondTerm.name.toUpperCase();

                if (firstTermName < secondTermName) {
                    return -1;
                } else if (firstTermName > secondTermName) {
                    return 1;
                }
                return 0;
            })
        })
    };

    const sortByCol = (col_id) => {
        dispatch({
            type: ACTIONS.ORDER,
            data: termsAndCols.sort((firstTerm, secondTerm) => secondTerm.cols[col_id] - firstTerm.cols[col_id])
        });
    }


    return (<>
        {loading ? (<p>loading...</p>) : termsAndCols.length ? (<div className={'container'}>
            <div className={'row'}>
                <div className={'col-md-8 offset-md-2'}>
                    <table className={'mt-5 table table-dark table-hover table-striped text-center'}>
                        <thead>
                        <tr>
                            <th role={"button"} onClick={sortByName}>Thématique</th>
                            <th role={"button"} onClick={() => sortByCol(17)}>{isSmallScreen ? '1' : 'À apprendre'}</th>
                            <th role={"button"} onClick={() => sortByCol(18)}>{isSmallScreen ? '2' : 'Je sais un peu'}</th>
                            <th role={"button"} onClick={() => sortByCol(19)}>{isSmallScreen ? '3' : 'Je sais bien'}</th>
                            <th role={"button"} onClick={() => sortByCol(20)}>{isSmallScreen ? '4' : 'Je sais parfaitement'}</th>
                        </tr>
                        </thead>
                        <tbody>{termsAndCols.map((termAndCols) => <tr role={'button'}
                                                                      onClick={async () => props.handleClickHomeTableRow(termAndCols)}
                                                                      key={termAndCols.card_theme_id}>
                            <td>{transformText(termAndCols.name)}</td>
                            <td>{termAndCols.cols['17']}</td>
                            <td>{termAndCols.cols['18']}</td>
                            <td>{termAndCols.cols['19']}</td>
                            <td>{termAndCols.cols['20']}</td>
                        </tr>)}</tbody>
                    </table>
                </div>
            </div>
        </div>) : ('')}
    </>);
}

export default HomeTableTerms;