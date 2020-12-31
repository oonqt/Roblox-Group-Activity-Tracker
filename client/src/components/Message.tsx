import React, { FunctionComponent } from 'react';
import { Message } from 'rbx';
import { Variables } from 'rbx/base/helpers/variables';

interface Props {
    header: string,
    body: any,
    color: Variables['colors']
}   

const CustomMessage: FunctionComponent<Props> = (props) => {
    return (
        <Message color={props.color}>
            <Message.Header textColor="white">
                {props.header}
            </Message.Header>

            <Message.Body>
                {props.body}
            </Message.Body>
        </Message>
    )
}

export default CustomMessage;