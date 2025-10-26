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
${property.amenities && property.amenities.length > 0 ? `\nComodidades: ${property.amenities.join(', ')}` : ''}

Descrição: ${property.description || 'Não fornecida'}

CLÁUSULAS CONTRATUAIS

PRIMEIRA (Objeto do Contrato)
O SENHORIO arrenda ao INQUILINO o imóvel acima identificado, para fins de habitação, nos termos e condições estabelecidos no presente contrato.

SEGUNDA (Prazo)
O presente contrato tem a duração de ${duracaoMeses} meses, com início em ${formattedDataInicio} e termo em ${formattedDataFim}. O contrato renova-se automaticamente por períodos iguais, salvo denúncia por qualquer das partes com a antecedência mínima de 60 dias.

TERCEIRA (Renda)
3.1. A renda mensal é de ${formattedValor} (Kwanzas), a pagar mensalmente até ao dia 5 de cada mês.
3.2. O pagamento será efetuado por transferência bancária ou outro meio acordado entre as partes.
3.3. A renda será atualizada anualmente conforme coeficientes publicados pelo Executivo angolano.
3.4. É proibida a exigência de antecipação de rendas superior a 3 meses.

QUARTA (Entrega do Imóvel)
4.1. O SENHORIO entrega o imóvel em condições de habitabilidade, com todas as infraestruturas necessárias ao uso normal.
4.2. O INQUILINO obriga-se a receber o imóvel no estado em que se encontra, salvo vícios ocultos.

QUINTA (Obrigações do Senhorio)
5.1. Garantir o uso pacífico e tranquilo do imóvel.
5.2. Efetuar as reparações necessárias à conservação do imóvel.
5.3. Emitir recibo de todas as rendas recebidas.
5.4. Suportar as despesas de conservação extraordinária.

SEXTA (Obrigações do Inquilino)
6.1. Pagar pontualmente a renda nos termos acordados.
6.2. Usar o imóvel para os fins convencionados (habitação).
6.3. Conservar o imóvel em bom estado.
6.4. Efetuar pequenas reparações decorrentes do uso normal.
6.5. Permitir vistorias periódicas mediante aviso prévio de 48 horas.
6.6. Não subarrendar, ceder ou emprestar o imóvel sem autorização escrita do SENHORIO.
6.7. Não efetuar obras ou alterações estruturais sem consentimento prévio e escrito do SENHORIO.
6.8. Não deixar o imóvel desabitado por período superior a 1 ano.

SÉTIMA (Subarrendamento)
7.1. É proibido o subarrendamento, cessão ou empréstimo do imóvel sem autorização expressa e por escrito do SENHORIO.
7.2. A violação desta cláusula constitui fundamento para resolução imediata do contrato.

OITAVA (Despesas)
8.1. São por conta do INQUILINO as despesas de água, energia elétrica, gás e outras relativas ao uso normal do imóvel.
8.2. O Imposto Predial Urbano é da responsabilidade do SENHORIO.

NONA (Rescisão)
9.1. O contrato pode ser resolvido por:
   a) Não pagamento da renda por período superior a 2 meses;
   b) Uso do imóvel para fins diversos dos convencionados;
   c) Subarrendamento não autorizado;
   d) Deterioração grave do imóvel por culpa do INQUILINO;
   e) Imóvel desabitado por mais de 1 ano sem justificação;
   f) Mútuo acordo.
9.2. Em caso de rescisão antecipada sem justa causa, a parte faltosa pagará indemnização correspondente a 3 meses de renda.

DÉCIMA (Obras e Benfeitorias)
10.1. O INQUILINO não pode realizar obras ou alterações estruturais sem autorização prévia e escrita do SENHORIO.
10.2. As benfeitorias úteis ou voluptuárias realizadas sem autorização não conferem direito a indemnização.

DÉCIMA PRIMEIRA (Restituição do Imóvel)
11.1. No termo do contrato, o INQUILINO deve restituir o imóvel no estado em que o recebeu, salvo desgaste normal.
11.2. A restituição só se considera efetiva com a entrega das chaves e vistoria conjunta.
11.3. O pagamento da última renda é devido até à restituição efetiva do imóvel.

DÉCIMA SEGUNDA (Transmissão por Morte)
12.1. Em caso de morte do INQUILINO, o contrato transmite-se para:
   a) Cônjuge sobrevivo;
   b) Pessoa em união de facto (coabitação há mais de 3 anos);
   c) Descendentes ou ascendentes (convivência há mais de 1 ano).

DÉCIMA TERCEIRA (Proibição de Especulação)
13.1. Constitui crime de especulação, punível com multa:
   a) A recusa de emissão de recibo de renda;
   b) Receber quantias não previstas no contrato;
   c) Receber pagamento para desocupação do imóvel.

DÉCIMA QUARTA (Foro)
14.1. Para dirimir quaisquer litígios emergentes do presente contrato, as partes elegem o foro da Comarca de ${property.provincia}.

DÉCIMA QUINTA (Disposições Finais)
15.1. O presente contrato é regulado pela Lei n.º 26/15 de 23 de Outubro e pelo Código Civil angolano.
15.2. Qualquer alteração ao presente contrato deverá ser reduzida a escrito e assinada por ambas as partes.
15.3. As partes declaram ter lido, compreendido e aceite todos os termos do presente contrato.

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
