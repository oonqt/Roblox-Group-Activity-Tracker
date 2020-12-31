import React from 'react';
import { Content, Footer as RbxFooter } from 'rbx';

const Footer = () => {
    return (
        <footer>
            <RbxFooter>
                <Content className="has-text-centered">
                    <p className="has-text-grey">© Copyright 2020 JSystems. Site designed using <a href="https://dfee.github.io/rbx/">rbx</a></p>
                </Content>
            </RbxFooter>
        </footer>
    )
}

export default Footer;