import Vue from 'vue'
import Vuex from 'vuex'
import axios from './axios-auth';
import globalAxios from 'axios';
import router from './router';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    idToken: null,
    userId: null,
    user: null
  },
  mutations: {
    authUser (state, userData) {
      state.idToken = userData.token;
      state.userId = userData.userId;
      state.user = userData;
    },
    storeUser(state, user) {
      state.user = user;
    },
    clearAuthData(state){
      state.idToken = null;
      state.userId  = null;
      state.user = null;
    }
  },
  actions: {
    setLogoutTimer({commit}, expirationTime){
      console.log("timeout", expirationTime);
      setTimeout(() => {
        commit('clearAuthData')
      }, expirationTime * 1000)
    }, 
    signup({commit, dispatch}, authData) {
      axios.post('/accounts:signUp?key=AIzaSyB4tw1Wt06IPmJYyDj8Gsd5wXw50p3drdE', { 
        email: authData.email,
        password: authData.password,
        returnSecureToken: true
      })
        .then(res => {
          console.log(res);
          commit('authUser', {
            token: res.data.idToken,
            userId: res.data.localId
          });
          console.log("res.data.expiresIn", res.data.expiresIn);

          const now = new Date();
          const exprirationDate = new Date(now.getTime() + res.data.expiresIn * 1000);

          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('userId', res.data.localId);
          localStorage.setItem('expiresIn',exprirationDate);
          dispatch('storeUser', authData);
          dispatch('setLogoutTimer', res.data.expiresIn);
        })
        .catch(error => console.log(error));
    }, 
    login({commit,dispatch}, authData) {

      axios.post('/accounts:signInWithPassword?key=AIzaSyB4tw1Wt06IPmJYyDj8Gsd5wXw50p3drdE', { 
        email: authData.email,
        password: authData.password,
        returnSecureToken: true
      })
        .then(res => {
          console.log("login result: ", res);
          console.log("login result: ", res.data.expiresIn);
          const now = new Date();
          const exprirationDate = new Date(now.getTime() + res.data.expiresIn * 1000);

          commit('authUser', {
            token: res.data.idToken,
            userId: res.data.localId
          });
          localStorage.setItem('token', res.data.idToken);
          localStorage.setItem('userId', res.data.localId);
          localStorage.setItem('expiresIn',exprirationDate);

        
          dispatch('setLogoutTimer', res.data.expiresIn);
          router.replace('/dashboard');
        })
        .catch(error => console.log(error));

    },
    tryAutoLogin({commit}){
      const token = localStorage.getItem('token');
      if(!token){
        return 
      }
      const exprirationDate = localStorage.get('expriesIn');
      const now = new Date();
      if (now >= exprirationDate){
        return
      }
      const userId = localStorage.getItem('userId');
      commit('authUser', {
        token: token, 
        userId: userId
      })
    }, 
    logout({commit}){
      commit('clearAuthData');
      localStorage.removeItem('expriesIn');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      router.replace('/signin');
    },
    storeUser ({commit, state}, userData){
      if(!state.idToken) {
        return 
      }
      globalAxios.post('/users.json' + '?auth='+ state.idToken, userData)
          .then(res => console.log("store user result : ",res))
          .catch(error => console.log(error));
    },
    fetchUser ({commit,state}){
      if(!state.idToken) {
        return 
      }
      globalAxios.get('/users.json' + '?auth='+ state.idToken)
      .then(res => {
        console.log(res)
        const data = res.data
        const users = []
        for (let key in data) {
          const user = data[key]
          user.id = key
          users.push(user)
        }
        console.log(users)
        commit('storeUser', users[0])
      })
      .catch(error => console.log(error))

    }
  },
  getters: {
     user (state) {
       return state.user;
     },
     isAuthenticated(state){
       console.log("isAuthenticated ", state.idToken, state.idToken !== null)
       return state.idToken !== null
     }
  }
})