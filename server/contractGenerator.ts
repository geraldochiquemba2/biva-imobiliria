import type { User, Property } from "@shared/schema";
import { format } from "date-fns";

export function generateRentalContract(
  property: Property,
  proprietario: User,
  cliente: User,
  valor: number,
  dataInicio: Date,
  dataFim: Date
): string {
  const formattedDataInicio = format(new Date(dataInicio), "dd/MM/yyyy");
  const formattedDataFim = format(new Date(dataFim), "dd/MM/yyyy");
  const formattedValor = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA'
  }).format(valor);

  const duracaoMeses = Math.ceil(
    (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return `
CONTRATO DE ARRENDAMENTO URBANO

Em conformidade com a Lei n.º 26/15 de 23 de Outubro (Lei do Arrendamento Urbano)

IDENTIFICAÇÃO DAS PARTES

SENHORIO (Proprietário/Arrendador):
Nome: ${proprietario.fullName}
Bilhete de Identidade/Passaporte: ${proprietario.bi || "Não fornecido"}
Telefone: ${proprietario.phone}
${proprietario.email ? `Email: ${proprietario.email}` : ''}
${proprietario.address ? `Endereço: ${proprietario.address}` : ''}

INQUILINO (Arrendatário):
Nome: ${cliente.fullName}
Bilhete de Identidade/Passaporte: ${cliente.bi || "Não fornecido"}
Telefone: ${cliente.phone}
${cliente.email ? `Email: ${cliente.email}` : ''}
${cliente.address ? `Endereço: ${cliente.address}` : ''}

IDENTIFICAÇÃO DO IMÓVEL

Designação: ${property.title}
Tipo: ${property.category}
Localização: ${property.bairro}, ${property.municipio}, ${property.provincia}
Área: ${property.area}m²
Características:
- ${property.bedrooms} Quarto(s)
- ${property.bathrooms} Casa(s) de Banho
- ${property.livingRooms} Sala(s)
- ${property.kitchens} Cozinha(s)

Comodidades: ${property.amenities && property.amenities.length > 0 ? property.amenities.join(', ') : 'Não especificadas'}

Descrição: ${property.description || 'Não fornecida'}








CLÁUSULAS CONTRATUAIS

Cláusula 01ª (Objeto do Contrato)

O SENHORIO arrenda ao INQUILINO o imóvel acima identificado, para fins de habitação, nos termos e condições estabelecidos no presente contrato.

Cláusula 02ª (Prazo)

O presente contrato tem a duração de ${duracaoMeses} meses, com início em ${formattedDataInicio} e termo em ${formattedDataFim}. O contrato renova-se automaticamente por períodos iguais, salvo denúncia por qualquer das partes com a antecedência mínima de 60 dias.

Cláusula 03ª (Renda)

Em relação ao pagamento da renda mensal, fica estabelecido que a renda mensal é de ${formattedValor} (Kwanzas), a pagar mensalmente até ao dia 5 de cada mês. O pagamento será efetuado por transferência bancária ou outro meio acordado entre as partes. A renda será atualizada anualmente conforme coeficientes publicados pelo Executivo angolano. É proibida a exigência de antecipação de rendas superior a 3 meses.

Cláusula 04ª (Entrega do Imóvel)

O SENHORIO entrega o imóvel em condições de habitabilidade, com todas as infraestruturas necessárias ao uso normal. O INQUILINO obriga-se a receber o imóvel no estado em que se encontra, salvo vícios ocultos que comprometam a habitabilidade ou a segurança do mesmo.

Cláusula 05ª (Obrigações do Senhorio)

O SENHORIO obriga-se a garantir o uso pacífico e tranquilo do imóvel, efetuar as reparações necessárias à conservação do imóvel, emitir recibo de todas as rendas recebidas, e suportar as despesas de conservação extraordinária que se façam necessárias durante a vigência do contrato.

Cláusula 06ª (Obrigações do Inquilino)

O INQUILINO compromete-se a pagar pontualmente a renda nos termos acordados, usar o imóvel para os fins convencionados (habitação), conservar o imóvel em bom estado, efetuar pequenas reparações decorrentes do uso normal, permitir vistorias periódicas mediante aviso prévio de 48 horas, não subarrendar, ceder ou emprestar o imóvel sem autorização escrita do SENHORIO, não efetuar obras ou alterações estruturais sem consentimento prévio e escrito do SENHORIO, e não deixar o imóvel desabitado por período superior a 1 ano.

Cláusula 07ª (Subarrendamento)

É expressamente proibido o subarrendamento, cessão ou empréstimo do imóvel sem autorização expressa e por escrito do SENHORIO. A violação desta cláusula constitui fundamento para resolução imediata do contrato, sem prejuízo das sanções legais aplicáveis.

Cláusula 08ª (Despesas)

São por conta do INQUILINO as despesas de água, energia elétrica, gás e outras relativas ao uso normal do imóvel. O Imposto Predial Urbano é da responsabilidade do SENHORIO, conforme determinado pela legislação em vigor.

Cláusula 09ª (Incumprimento Contratual e Penalizações)

Em caso de incumprimento do disposto no presente contrato, no que refere à exclusividade da gestão do negócio pela Mediadora, a Proprietária obriga-se ao pagamento de 100% do montante percentual acordados, e devem ser pagos até 3 (três) dias úteis após a tomada de conhecimento da violação do contrato, mediante carta de interpelação para cumprimento. De igual modo, a Mediadora obriga-se ao pagamento de penalidades decorrentes de negligência na gestão do processo de mediação exclusiva e proteção do Imóvel sob sua custódia.

Cláusula 10ª (Obras e Benfeitorias)

O INQUILINO não pode realizar obras ou alterações estruturais sem autorização prévia e escrita do SENHORIO. As benfeitorias úteis ou voluptuárias realizadas sem autorização não conferem direito a indemnização, ficando integradas no imóvel.

Cláusula 11ª (Restituição do Imóvel)

No termo do contrato, o INQUILINO deve restituir o imóvel no estado em que o recebeu, salvo desgaste normal decorrente do uso adequado. A restituição só se considera efetiva com a entrega das chaves e vistoria conjunta. O pagamento da última renda é devido até à restituição efetiva do imóvel.

Cláusula 12ª (Transmissão por Morte)

Em caso de morte do INQUILINO, o contrato transmite-se para o cônjuge sobrevivo, pessoa em união de facto (coabitação há mais de 3 anos), ou descendentes ou ascendentes (convivência há mais de 1 ano), respeitando-se a ordem de preferência estabelecida na legislação aplicável.

Cláusula 13ª (Proibição de Especulação)

Constitui crime de especulação, punível com multa nos termos da lei, a recusa de emissão de recibo de renda, receber quantias não previstas no contrato, ou receber pagamento para desocupação do imóvel, sendo aplicáveis as sanções previstas na legislação penal angolana.

Cláusula 14ª (Foro)

Para dirimir quaisquer litígios emergentes do presente contrato, as partes elegem o foro da Comarca de ${property.provincia}, com expressa renúncia a qualquer outro, por mais privilegiado que seja.

Cláusula 15ª (Disposições Finais)

O presente contrato é regulado pela Lei n.º 26/15 de 23 de Outubro e pelo Código Civil angolano. Qualquer alteração ao presente contrato deverá ser reduzida a escrito e assinada por ambas as partes. As partes declaram ter lido, compreendido e aceite todos os termos do presente contrato.

Data de Celebração: ${format(new Date(), "dd/MM/yyyy")}

ASSINATURAS DIGITAIS

_________________________________
SENHORIO (Proprietário)
Nome: ${proprietario.fullName}
BI/Passaporte: ${proprietario.bi || "Não fornecido"}

_________________________________
INQUILINO (Arrendatário)
Nome: ${cliente.fullName}
BI/Passaporte: ${cliente.bi || "Não fornecido"}
`;
}
