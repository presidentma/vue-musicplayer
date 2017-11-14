// 两种使用场景，异步操作，mutation的封装
import * as types from './mutation-types'

export const selectPlay = function({commit, status}, {list, index}) {
  commit(types.SET_SQUENCELIST, list)
  commit(types.SET_PLAYLIST, list)
  commit(types.SET_CURRENT_INDEX, index)
  commit(types.SET_FULLSCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}
