import {
  Alignment,
  Icon,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading
} from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { NavLink } from 'react-router-dom'

import { Role } from '../reducers/states'
import Dropdown from './dropdown'

export interface INavigationBarProps {
  handleLogOut: () => void
  role?: Role
  title: string
  username?: string
}

const NavigationBar: React.SFC<INavigationBarProps> = props => (
  <Navbar className="NavigationBar primary-navbar pt-dark">
    <NavbarGroup align={Alignment.LEFT}>
      <NavLink
        to="/academy"
        activeClassName="pt-active"
        className="NavigationBar__link pt-button pt-minimal"
      >
        <Icon icon={IconNames.SYMBOL_DIAMOND} />
        <NavbarHeading className="hidden-xs">Source Academy</NavbarHeading>
      </NavLink>

      <NavLink
        to="/news"
        activeClassName="pt-active"
        className="NavigationBar__link pt-button pt-minimal"
      >
        <Icon icon={IconNames.FEED} />
        <div className="navbar-button-text hidden-xs">News</div>
      </NavLink>

      <NavLink
        to="/material"
        activeClassName="pt-active"
        className="NavigationBar__link pt-button pt-minimal"
      >
        <Icon icon={IconNames.FOLDER_OPEN} />
        <div className="navbar-button-text hidden-xs">Material</div>
      </NavLink>
    </NavbarGroup>

    <NavbarGroup align={Alignment.RIGHT}>
      <NavLink
        to="/playground"
        activeClassName="pt-active"
        className="NavigationBar__link pt-button pt-minimal"
      >
        <Icon icon={IconNames.CODE} />
        <div className="navbar-button-text hidden-xs">Playground</div>
      </NavLink>

      <div className="visible-xs">
        <NavbarDivider className="thin-divider" />
      </div>
      <div className="hidden-xs">
        <NavbarDivider className="default-divider" />
      </div>

      <Dropdown handleLogOut={props.handleLogOut} username={props.username} />

    </NavbarGroup>
  </Navbar>
)

export default NavigationBar
