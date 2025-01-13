import { IconBaseProps } from 'react-icons';

export interface PageHeaderProps {
  icon?: React.ReactElement<IconBaseProps>;
  title: string;
  icon_size?: string | number;
}
