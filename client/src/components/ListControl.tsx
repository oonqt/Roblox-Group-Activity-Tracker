import React, { FunctionComponent } from 'react';
import { Input, Field, Control, Icon, Select } from 'rbx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface Props {
    dateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    searchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    search: string;
	weekRanges: string[];
	weekId: string;
}

const ListControl: FunctionComponent<Props> = (props) => {
    return (
			<Field kind='group' className='controls'>
				<Control expanded>
					<Select.Container onChange={props.dateChange}>
						<Select value={props.weekId}>
							{
								props.weekRanges.map(range => (
									<Select.Option value={range}>{range.split('-W')[0]}, Week {range.split('-W')[1]}</Select.Option>
								))
							}
						</Select>
					</Select.Container>
				</Control>

				<Control expanded iconLeft>
					<Input
						value={props.search}
						type='text'
						placeholder='Filter users'
						color='dark'
						onChange={props.searchChange}
					/>
					<Icon align='left' size='small' color='dark'>
						<FontAwesomeIcon icon={faSearch} />
					</Icon>
				</Control>
			</Field>
		);
}

export default ListControl;
