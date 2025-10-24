import UserProfileCard from '../UserProfileCard';

export default function UserProfileCardExample() {
  return (
    <div className="max-w-sm p-4">
      <UserProfileCard
        title="Proprietários"
        description="Gerenciar contratos e propriedades com facilidade"
        iconType="owner"
        index={0}
      />
    </div>
  );
}
