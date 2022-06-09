using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class HelpForm : Form
    {
        public HelpForm(UserControl userControl = null)
        {
            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            if (userControl != null)
            {
                Controls.Add(userControl);
                userControl.Dock = DockStyle.Top;
            }
        }
    }
}
