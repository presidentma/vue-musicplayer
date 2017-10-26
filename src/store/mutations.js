import * as types from './mutation-types'

const mutations = {
  [types.SET_SINGER](state, singer) {
    state.singer = singer
  },
  [types.SET_PLAYING_STATE](state, flag) {
    state.singer = flag
  },
  [types.SET_FULLSCREEN](state, flag) {
    state.singer = flag
  },
  [types.SET_PLAYLIST](state, list) {
    state.singer = list
  },
  [types.SET_SQUENCELIST](state, list) {
    state.singer = list
  },
  [types.SET_PLAY_MODE](state, mode) {
    state.singer = mode
  },
  [types.SET_CURRENT_INDEX](state, index) {
    state.singer = index
  }
}

export default mutations